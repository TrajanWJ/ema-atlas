"""Autharis matching microservice (Lane F7).

Python 3.12+ FastAPI service that scores and ranks talent against job requests.
Mirrors the shape of `autharis/lib/data.ts` (`Talent`, `JobRequest`) and exposes
a scoring contract that aligns with Lane E4.
"""

__version__ = "0.1.0"
