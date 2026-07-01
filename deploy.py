#!/usr/bin/env python3
r"""
deploy.py — деплой статического сайта templatus на сервер.
Аналогичен D:\Development\GitHub\my\deploy.py, но адаптирован под чистый
frontend (HTML/CSS/JS) + Caddy.

Логика:
1. git add / commit / push в origin main
2. Подключение по SSH к серверу
3. Клонирование / обновление репозитория в REMOTE_BASE
4. Обновление Caddyfile и перезагрузка Caddy
"""

import os
import re
import shlex
import subprocess
import sys
from pathlib import Path

import paramiko

# --- Конфигурация ---
REMOTE_HOST = os.getenv("TEMPLATUS_HOST", "158.255.4.142").strip()
REMOTE_USER = os.getenv("TEMPLATUS_USER", "root").strip()
REMOTE_PASSWORD = os.getenv("TEMPLATUS_PASSWORD", "Kostaden2312-").strip()
REMOTE_BASE = os.getenv("TEMPLATUS_REMOTE_BASE", "/opt/templatus").strip()
REMOTE_CADDYFILE_PATH = os.getenv(
    "TEMPLATUS_CADDYFILE_PATH", "/opt/safescan/Caddyfile"
).strip()
DOMAIN = os.getenv("TEMPLATUS_DOMAIN", "templatus.ru").strip()
REPO_URL = os.getenv("TEMPLATUS_REPO_URL", "").strip()


def run(cmd: list[str] | str, check: bool = True, cwd: Path | None = None, shell: bool = True) -> subprocess.CompletedProcess:
    """Запуск shell-команды с выводом в реальном времени."""
    if isinstance(cmd, list):
        if shell:
            cmd_str = " ".join(shlex.quote(str(c)) for c in cmd)
        else:
            cmd_str = None
    else:
        cmd_str = cmd
    print(f">>> {cmd if isinstance(cmd, str) else ' '.join(shlex.quote(str(c)) for c in cmd)}")
    if cmd_str is not None:
        return subprocess.run(cmd_str, shell=True, check=check, cwd=cwd)
    return subprocess.run(cmd, shell=False, check=check, cwd=cwd)


def get_repo_url() -> str:
    """Получает URL удалённого репозитория origin."""
    if REPO_URL:
        return REPO_URL
    result = subprocess.run(
        "git remote get-url origin",
        shell=True,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print("ERROR: Could not determine git remote URL.")
        print("Set TEMPLATUS_REPO_URL or configure origin remote.")
        sys.exit(1)
    return result.stdout.strip()


def git_push() -> None:
    """Коммитит и пушит изменения в текущую ветку."""
    print("\n=== GIT PUSH ===")
    run(["git", "add", "."])

    has_commits = subprocess.run(
        "git rev-parse HEAD", shell=True, capture_output=True
    ).returncode == 0

    if not has_commits:
        run(["git", "commit", "-m", "Initial commit"], shell=False)
    else:
        try:
            run(["git", "commit", "-m", "deploy: update templatus site"], shell=False)
        except subprocess.CalledProcessError:
            print("No changes to commit or commit failed, continuing...")

    run(["git", "push", "origin", "main"])


def ensure_remote_dir(sftp_client, remote_dir: str) -> None:
    """Рекурсивно создаёт удалённые директории (mkdir -p через SFTP)."""
    dirs = []
    current = remote_dir
    while current and current != "/":
        try:
            sftp_client.stat(current)
            break
        except IOError:
            dirs.append(current)
            current = os.path.dirname(current)
    for d in reversed(dirs):
        sftp_client.mkdir(d)


def update_caddyfile(sftp_client) -> None:
    """Добавляет или обновляет блок домена в общем Caddyfile на сервере."""
    print(f"\nUpdating Caddyfile at {REMOTE_CADDYFILE_PATH} ...")
    ensure_remote_dir(sftp_client, os.path.dirname(REMOTE_CADDYFILE_PATH))

    local_path = Path("Caddyfile.remote")
    try:
        try:
            sftp_client.get(REMOTE_CADDYFILE_PATH, str(local_path))
            content = local_path.read_text(encoding="utf-8")
        except IOError:
            content = ""

        domain_block = f"""{DOMAIN} {{
    root * {REMOTE_BASE}
    file_server
    encode gzip zstd
    try_files {{path}} {{path}}.html /index.html /404.html
}}"""

        http_block = f""":80 {{
    root * {REMOTE_BASE}
    file_server
    encode gzip zstd
    try_files {{path}} {{path}}.html /index.html /404.html
}}"""

        # Удаляем существующий блок домена, включая возможные артефакты
        escaped_domain = re.escape(DOMAIN)
        pattern = re.compile(
            rf"^{escaped_domain}\s*\{{.*?^\}}\n?",
            re.MULTILINE | re.DOTALL,
        )
        content = pattern.sub("", content)
        # Удаляем старый HTTP catch-all блок, если есть
        content = re.sub(r"^:80\s*\{.*?^\}\n?", "", content, flags=re.MULTILINE | re.DOTALL)
        # Удаляем оставшиеся артефакты try_files, если они есть
        content = re.sub(r"\s*\{path\}\.html /404\.html\s*\}?\s*", "\n", content)
        content = re.sub(r"\n{3,}", "\n\n", content)
        content = content.rstrip("\n") + "\n\n" + domain_block + "\n\n" + http_block

        local_path.write_text(content, encoding="utf-8")
        sftp_client.put(str(local_path), REMOTE_CADDYFILE_PATH)
    finally:
        local_path.unlink(missing_ok=True)


def deploy_ssh() -> None:
    """Деплоит статический сайт на сервер."""
    print("\n=== SSH DEPLOY ===")
    if not REMOTE_HOST or not REMOTE_PASSWORD:
        print(
            "\nERROR: SSH credentials not configured.\n"
            "Set environment variables before running deploy.py:\n"
            "  $env:TEMPLATUS_HOST = '158.255.4.142'\n"
            "  $env:TEMPLATUS_USER = 'root'\n"
            "  $env:TEMPLATUS_PASSWORD = 'your_password'\n"
            "  $env:TEMPLATUS_REMOTE_BASE = '/opt/templatus'  # optional\n"
        )
        sys.exit(1)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(REMOTE_HOST, username=REMOTE_USER, password=REMOTE_PASSWORD)

    sftp = client.open_sftp()
    try:
        ensure_remote_dir(sftp, REMOTE_BASE)
        update_caddyfile(sftp)
    finally:
        sftp.close()

    repo_url = get_repo_url()

    # Команды на сервере
    commands = [
        f"if [ ! -d {REMOTE_BASE}/.git ]; then rm -rf {REMOTE_BASE} && git clone {repo_url} {REMOTE_BASE}; fi",
        f"cd {REMOTE_BASE} && git checkout . && git pull origin main",
        # Перезагружаем Caddy в Docker
        "docker exec safescan-caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile",
    ]

    full_output = []
    exit_code = 0
    for cmd in commands:
        print(f"\n>>> {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd)
        out = stdout.read().decode("utf-8", errors="replace")
        err = stderr.read().decode("utf-8", errors="replace")
        code = stdout.channel.recv_exit_status()
        full_output.append(
            f"=== CMD ===\n{cmd}\n=== EXIT ===\n{code}\n=== STDOUT ===\n{out}\n=== STDERR ===\n{err}"
        )
        if code != 0:
            exit_code = code
            print(out[-2000:])
            print(err[-2000:])
            break

    client.close()

    with open("deploy_output.txt", "w", encoding="utf-8") as f:
        f.write("\n\n".join(full_output))

    if exit_code != 0:
        print(f"\nDeploy failed with exit code {exit_code}")
        sys.exit(exit_code)

    print(f"\nDeployed successfully to {REMOTE_HOST}")
    print(f"Site should be available at https://{DOMAIN}")


def main() -> None:
    git_push()

    if REMOTE_HOST and REMOTE_PASSWORD:
        deploy_ssh()
    else:
        print("\nSSH credentials not set, skipping server deploy.")


if __name__ == "__main__":
    main()
