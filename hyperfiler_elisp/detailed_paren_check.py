#!/usr/bin/env python3
"""
Enhanced script to find exact locations where parentheses are unbalanced in Emacs Lisp.
"""

def find_unbalanced_parens(file_path):
    """Find unbalanced parentheses with more detailed context."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        with open(file_path, 'r', encoding='latin-1') as f:
            content = f.read()
    
    lines = content.splitlines()
    stack = []  # (line_num, col_num, context, paren_count_at_this_level)
    paren_balance = 0
    
    in_string = False
    in_comment = False
    escape_next = False
    current_function = None
    
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
                
            # End of line resets comment
            if char == '\n':
                in_comment = False
                
            # Skip if we're in string or comment
            if in_string or in_comment:
                continue
            
            # Track current function for context
            if line.strip().startswith('(defun '):
                current_function = line.strip()[:50] + "..."
            
            # Process parentheses
            if char == '(':
                paren_balance += 1
                stack.append((line_num, col_num + 1, current_function or line.strip()[:50], paren_balance))
            elif char == ')':
                paren_balance -= 1
                if stack:
                    stack.pop()
                else:
                    print(f"Line {line_num}, Col {col_num + 1}: Extra closing parenthesis in: {line.strip()}")
    
    # Report unclosed parentheses
    if stack:
        print(f"Found {len(stack)} unclosed opening parentheses:")
        for line_num, col_num, context, balance in stack:
            print(f"Line {line_num}, Col {col_num}: Unclosed '(' in {context} (balance: {balance})")
    
    print(f"\\nTotal parentheses balance: {paren_balance}")
    return stack

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python3 detailed_paren_check.py <file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    stack = find_unbalanced_parens(file_path)