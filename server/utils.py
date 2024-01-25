import re

import math


def calculate_password_entropy(password):
    password_length = len(password)

    character_counts = {}
    for char in password:
        character_counts[char] = character_counts.get(char, 0) + 1
    probabilities = {char: count / password_length for char, count in character_counts.items()}

    entropy = 0
    for char, prob in probabilities.items():
        entropy -= prob * math.log2(prob)

    return entropy


def validate_email(email: str):
    email_regex = r"[^\s@]+@[^\s@]+\.[^\s@]+"
    return re.match(email_regex, email) is not None


def validate_password(password: str):
    if len(password) < 11:
        return False, "Password must be at least 11 characters long."

    has_upper = any(char.isupper() for char in password)
    has_lower = any(char.islower() for char in password)
    has_digit = any(char.isdigit() for char in password)
    has_special = any(not char.isalnum() for char in password)

    if not (has_upper and has_lower and has_digit and has_special):
        return False, "Password must contain a mix of uppercase, lowercase, digits, and special characters."

    entropy = 0
    for char in password:
        if char.islower():
            entropy += 4.7 
        elif char.isupper():
            entropy += 5.1  
        elif char.isdigit():
            entropy += 3.3  
        else:
            entropy += 6.5 

    if entropy < 29:
        return False, "Password strength is too weak. Consider using a longer password or more diverse characters."
    return True, "Password is strong."


def validate_input(input_string):
    special_chars = [';', ',', '--', '/*', '*/', '=', '<', '>', '+', '(', ')', 'UNION', 'OR', 'AND',
                     '<', '>', '&', '\'', '"', '/', '(', ')', ':', '%', '+', 'javascript:']
    if any(char in input_string for char in special_chars):
        return False
    return True
