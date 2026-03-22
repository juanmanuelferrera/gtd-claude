#!/usr/bin/env python3
"""
Script to find exactly where parentheses are unbalanced in an Emacs Lisp file.
"""

def check_parentheses_balance(file_path):
    """Check parentheses balance and report exact locations of issues."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except UnicodeDecodeError:
        with open(file_path, 'r', encoding='latin-1') as f:
            lines = f.readlines()
    
    stack = []  # Stack to track opening parentheses
    issues = []
    
    in_string = False
    in_comment = False
    escape_next = False
    
    for line_num, line in enumerate(lines, 1):
        for col_num, char in enumerate(line):
            # Handle escape sequences
            if escape_next:
                escape_next = False
                continue
            if char == '\\' and in_string:
                escape_next = True
                continue
            
            # Handle strings
            if char == '"' and not in_comment:
                in_string = not in_string
                continue
            
            # Handle comments
            if char == ';' and not in_string:
                in_comment = True
                continue
            if char == '\n':
                in_comment = False
                continue
                
            # Skip if we're in string or comment
            if in_string or in_comment:
                continue
            
            # Process parentheses
            if char == '(':
                stack.append((line_num, col_num + 1, line.strip()))
            elif char == ')':
                if not stack:
                    issues.append(f"Line {line_num}, Col {col_num + 1}: Extra closing parenthesis")
                else:
                    stack.pop()
    
    # Report unclosed parentheses
    for line_num, col_num, line_content in stack:
        issues.append(f"Line {line_num}, Col {col_num}: Unclosed opening parenthesis - {line_content[:50]}...")
    
    return issues

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python3 check_parens.py <file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    issues = check_parentheses_balance(file_path)
    
    if issues:
        print(f"Found {len(issues)} parentheses issues:")
        for issue in issues:
            print(issue)
    else:
        print("All parentheses are balanced!")