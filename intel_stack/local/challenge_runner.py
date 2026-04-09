from datetime import date
import random

print("Running challenge engine...")

sample = [
    "You say automation-first but still operate manually.",
    "You are collecting signals but not acting on them fast enough.",
    "You are sending messages without tracking outcomes."
]

print(f"{date.today()} Challenge: {random.choice(sample)}")
