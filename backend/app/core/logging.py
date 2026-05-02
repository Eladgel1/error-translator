import logging
import sys
from logging import Logger

from app.core.config import settings

LOG_FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"


def configure_logging() -> None:
    """
    Configure root logging for the application.

    Called once from main.create_app().
    """

    logging.basicConfig(
        level=settings.log_level.upper(),
        format=LOG_FORMAT,
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )


def get_logger(name: str = "error-translator") -> Logger:
    """
    Convenience helper to get a namespaced logger.
    """

    return logging.getLogger(name)
