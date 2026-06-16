"""Helpers for validating user-supplied external URLs before fetching."""

from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse


BLOCKED_HOSTS = {
    "localhost",
    "metadata.google.internal",
}

CLOUD_METADATA_IPS = {
    ipaddress.ip_address("169.254.169.254"),
}


def _is_blocked_ip(ip_value: str) -> bool:
    ip = ipaddress.ip_address(ip_value)
    return (
        ip.is_loopback
        or ip.is_private
        or ip.is_link_local
        or ip.is_unspecified
        or ip in CLOUD_METADATA_IPS
    )


def validate_public_http_url(url: str) -> str:
    """Return a normalized URL or raise ValueError for unsafe fetch targets."""
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("Only http and https URLs are allowed.")
    if not parsed.hostname:
        raise ValueError("A valid URL hostname is required.")

    hostname = parsed.hostname.strip().lower().rstrip(".")
    if hostname in BLOCKED_HOSTS or hostname.endswith(".localhost"):
        raise ValueError("This URL host is not allowed.")

    try:
        if _is_blocked_ip(hostname):
            raise ValueError("This URL resolves to a private or internal address.")
    except ValueError as error:
        if "private or internal" in str(error):
            raise

    try:
        resolved = socket.getaddrinfo(hostname, parsed.port, type=socket.SOCK_STREAM)
    except socket.gaierror as error:
        raise ValueError("URL hostname could not be resolved.") from error

    for item in resolved:
        address = item[4][0]
        if _is_blocked_ip(address):
            raise ValueError("This URL resolves to a private or internal address.")

    return parsed.geturl()
