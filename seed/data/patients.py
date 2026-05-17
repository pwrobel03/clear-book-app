"""
seed/data/patients.py
=====================
Patient name pool and factory function.

make_patients(n) returns a list of n unique patient dicts.
Extend _FIRST / _LAST to add more name variety.
"""

import random

_FIRST: list[str] = [
    "Anna", "Bart", "Clara", "Daniel", "Emily",
    "Frank", "Grace", "Henry", "Irene", "Jack",
    "Kate", "Leon", "Maria", "Nick", "Olivia",
    "Paul", "Rachel", "Simon", "Tina", "Victor",
]

_LAST: list[str] = [
    "Smith", "Brown", "Taylor", "Wilson", "Evans",
    "Thomas", "Roberts", "Johnson", "White", "Harris",
    "Martin", "Clark", "Lewis", "Walker", "Hall",
    "Young", "Allen", "Wright", "Scott", "King",
]


def make_patients(n: int, seed: int = 42) -> list[dict]:
    """
    Generate *n* unique patient dicts.
    Each dict has: first_name, last_name, email.
    Email collisions are resolved by appending a counter suffix.
    """
    rng = random.Random(seed)
    seen: set[str] = set()
    result: list[dict] = []

    for _ in range(n):
        fn = rng.choice(_FIRST)
        ln = rng.choice(_LAST)
        base  = f"{fn.lower()}.{ln.lower()}"
        email = f"{base}@example.com"
        i = 2
        while email in seen:
            email = f"{base}{i}@example.com"
            i += 1
        seen.add(email)
        result.append({"first_name": fn, "last_name": ln, "email": email})

    return result
