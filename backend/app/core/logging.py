import logging
from logging import Logger


LOG_FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"


def configure_logging(level: int = logging.info) -> None:
    """
    Configure root logging for the application.

    Called once from main.create_app().
    """

    logging.basicConfig(
        level=level,
        format=LOG_FORMAT,
    )


def get_logger(name: str = "error-translator") -> Logger:
    """
    Convenience helper to get a namespaced logger.        
    """

    return logging.getLogger(name)
