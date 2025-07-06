import os
import re

SRC_DIR = "src"
ALIAS_PREFIX = "@/"

def find_real_path(alias_path):
    """Convert '@/lib/auth' → src/lib/auth.ts"""
    path = alias_path.replace(ALIAS_PREFIX, SRC_DIR + "/").strip()
    if not path.endswith(".ts") and not path.endswith(".js"):
        path += ".ts"
    return os.path.abspath(path)

def compute_relative_import(file_path, target_path):
    """Given the source file and target module, return the correct relative import path"""
    from_dir = os.path.dirname(os.path.abspath(file_path))
    rel_path = os.path.relpath(target_path, start=from_dir)
    rel_path = rel_path.replace(".ts", "").replace(".js", "").replace("\\", "/")
    if not rel_path.startswith("."):
        rel_path = "./" + rel_path
    return rel_path

def fix_file_imports(file_path):
    with open(file_path, "r") as f:
        lines = f.readlines()

    modified = False
    new_lines = []

    for line in lines:
        # Match alias imports like @/lib/auth
        match = re.search(r'from\s+[\'"](@/[^\'"]+)[\'"]', line)
        if match:
            alias_path = match.group(1)
            try:
                abs_target_path = find_real_path(alias_path)
                corrected_path = compute_relative_import(file_path, abs_target_path)
                new_line = re.sub(r'from\s+[\'"]@/[^\'"]+[\'"]', f'from "{corrected_path}"', line)
                new_lines.append(new_line)
                modified = True
            except Exception as e:
                print(f"⚠️ Failed to resolve {alias_path} in {file_path}: {e}")
                new_lines.append(line)
        else:
            new_lines.append(line)

    if modified:
        print(f"✔ Fixed imports in: {file_path}")
        with open(file_path, "w") as f:
            f.writelines(new_lines)

def scan_project():
    for root, _, files in os.walk(SRC_DIR):
        for file in files:
            if file.endswith(".ts") or file.endswith(".js") or file.endswith(".tsx"):
                full_path = os.path.join(root, file)
                fix_file_imports(full_path)

if __name__ == "__main__":
    scan_project()
