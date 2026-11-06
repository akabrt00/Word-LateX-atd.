"""Create a protected local updater key; optionally provision repository secrets.

Never prints key or password contents. The password is protected with Windows DPAPI.
"""
import argparse
import ctypes
import json
from pathlib import Path
import secrets
import subprocess

ROOT = Path(__file__).resolve().parent.parent
KEY = ROOT / ".tools/update-signing/tul-writer.key"
PASSWORD = KEY.with_suffix(".password.dpapi")
REPO = "akabrt00/Word-LateX-atd."


class Blob(ctypes.Structure):
    _fields_ = [("size", ctypes.c_ulong), ("data", ctypes.POINTER(ctypes.c_ubyte))]


def protect(data, decrypt=False):
    buffer = ctypes.create_string_buffer(data)
    source = Blob(len(data), ctypes.cast(buffer, ctypes.POINTER(ctypes.c_ubyte)))
    target = Blob()
    fn = ctypes.windll.crypt32.CryptUnprotectData if decrypt else ctypes.windll.crypt32.CryptProtectData
    if not fn(ctypes.byref(source), None, None, None, None, 0, ctypes.byref(target)):
        raise RuntimeError("Windows DPAPI operation failed")
    try:
        return ctypes.string_at(target.data, target.size)
    finally:
        ctypes.windll.kernel32.LocalFree(target.data)


def run(args, data=None):
    result = subprocess.run(args, cwd=ROOT, input=data, capture_output=True)
    if result.returncode:
        # CLI output may contain secrets; deliberately do not include it in errors.
        raise RuntimeError("Command failed: " + " ".join(str(a) for a in args[:3]))
    return result.stdout


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--upload", action="store_true")
    args = parser.parse_args()
    config_path = ROOT / "src-tauri/tauri.conf.json"
    config = json.loads(config_path.read_text(encoding="utf8"))
    configured = config.get("plugins", {}).get("updater", {}).get("pubkey", "")
    if not KEY.exists():
        if configured:
            raise RuntimeError("A public key already exists. Restore the original private key; do not rotate it silently.")
        KEY.parent.mkdir(parents=True, exist_ok=True)
        password = secrets.token_urlsafe(48).encode()
        run(["node", str(ROOT / "node_modules/@tauri-apps/cli/tauri.js"), "signer", "generate",
             "--ci", "--password", password.decode(), "--write-keys", str(KEY)])
        PASSWORD.write_bytes(protect(password))
    if not PASSWORD.exists():
        raise RuntimeError("Missing DPAPI password backup")
    public = KEY.with_suffix(".key.pub").read_text(encoding="utf8").strip()
    if configured and public != configured:
        raise RuntimeError("Local and configured public keys differ")
    config.setdefault("plugins", {})["updater"] = {
        "pubkey": public, "endpoints": [], "requireSignedVersion": True,
        "windows": {"installMode": "passive"},
    }
    config["bundle"]["createUpdaterArtifacts"] = True
    config_path.write_text(json.dumps(config, indent=2) + "\n", encoding="utf8")
    if args.upload:
        existing = json.loads(run(["gh", "secret", "list", "--repo", REPO, "--json", "name"]))
        names = {entry["name"] for entry in existing}
        targets = {"TAURI_SIGNING_PRIVATE_KEY", "TAURI_SIGNING_PRIVATE_KEY_PASSWORD"}
        if names & targets:
            raise RuntimeError("Signing secrets already exist; refuse to replace them automatically")
        run(["gh", "secret", "set", "TAURI_SIGNING_PRIVATE_KEY", "--repo", REPO], KEY.read_bytes())
        run(["gh", "secret", "set", "TAURI_SIGNING_PRIVATE_KEY_PASSWORD", "--repo", REPO],
            protect(PASSWORD.read_bytes(), decrypt=True))
        print("Repository signing secrets provisioned; no secret contents printed.")
    else:
        print("Local signing key prepared; password protected with Windows DPAPI. Public key configured.")


if __name__ == "__main__":
    main()
