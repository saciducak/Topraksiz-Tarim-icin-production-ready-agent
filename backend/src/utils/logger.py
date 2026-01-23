"""
Topraksız Tarım AI Agent - Logger Utility
"""
import logging
import sys
from typing import Optional


def setup_logger(
    name: str = "topraksiz",
    level: int = logging.INFO,
    format_string: Optional[str] = None
) -> logging.Logger:
    """
    Setup and return a configured logger.
    
    Args:
        name: Logger name
        level: Logging level
        format_string: Optional custom format string
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    
    if logger.handlers:
        return logger
    
    logger.setLevel(level)
    
    # Console handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)
    
    # Format
    if format_string is None:
        format_string = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
    
    formatter = logging.Formatter(format_string, datefmt="%Y-%m-%d %H:%M:%S")
    handler.setFormatter(formatter)
    
    logger.addHandler(handler)
    
    return logger


# Default logger
logger = setup_logger()
