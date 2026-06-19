#!/usr/bin/env python3
"""Create a Supabase dump, gzip it, and upload the archive to the backups bucket."""

from __future__ import annotations

import argparse
import datetime
import logging
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def run(cmd: list[str], *, cwd: Path | None = None) -> None:
    logging.info("%s", " ".join(cmd))
    subprocess.run(cmd, check=True, cwd=cwd)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Dump the shared Supabase project and push a compressed copy into storage."
    )
    parser.add_argument(
        "--project",
        default=os.environ.get("SUPABASE_PROJECT", "concise"),
        help="Folder inside the backups bucket (default: %(default)s).",
    )
    parser.add_argument(
        "--bucket",
        default="backups",
        help="Supabase storage bucket name that holds manual dumps.",
    )
    parser.add_argument(
        "--name",
        help="Base name for the dump files (default: agentcompanies-supabase-<UTC timestamp>).",
    )
    parser.add_argument(
        "--keep-local",
        action="store_true",
        help="Skip deleting the temporary dump/gzip files so you can inspect them.",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Show more detailed logging (debug level).",
    )
    args = parser.parse_args()

    if args.verbose:
        logging.basicConfig(level=logging.DEBUG, format="%(message)s")
    else:
        logging.basicConfig(level=logging.INFO, format="%(message)s")

    for env_var in ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"):
        if env_var not in os.environ:
            logging.error("Environment variable %s is required.", env_var)
            sys.exit(1)

    utc_stamp = datetime.datetime.utcnow().strftime("%Y%m%d-%H%M")
    base_name = args.name or f"agentcompanies-supabase-{utc_stamp}"
    storage_path = f"{args.project}/{base_name}.sql.gz"

    tmp_dir = Path(tempfile.mkdtemp(prefix="supabase-dump-"))
    gz_file: Path | None = None
    try:
        dump_file = tmp_dir / f"{base_name}.sql"
        run(
            [
                "supabase",
                "db",
                "dump",
                "--file",
                str(dump_file),
            ]
        )

        run(["gzip", str(dump_file)])
        gz_file = dump_file.with_suffix(".sql.gz")

        run(
            [
                "supabase",
                "storage",
                "upload",
                args.bucket,
                storage_path,
                str(gz_file),
            ]
        )

        logging.info("Dump uploaded to %s/%s", args.bucket, storage_path)
    finally:
        if args.keep_local and gz_file is not None:
            logging.info("Local dump kept at %s", gz_file)
        else:
            shutil.rmtree(tmp_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
