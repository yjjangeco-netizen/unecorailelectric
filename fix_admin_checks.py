import os

# Files to patch based on grep results
files_to_patch = [
    r'src/app/api/work-diary/[id]/route.ts',
    r'src/app/api/work-diary/stats/route.ts',
    r'src/app/api/users/route.ts',
    r'src/app/api/stock/delete/route.ts',
    r'src/app/api/projects/[id]/route.ts',
    r'src/app/api/leave-requests/route.ts',
    r'src/app/api/events/[id]/route.ts'
]

# The common pattern seems to be checking 'administrator'
# We want to ensure 'admin' is also checked.

def patch_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if 'admin' check is missing but 'administrator' check exists
        if "userLevel === 'administrator'" in content and "userLevel === 'admin'" not in content:
            # Naive replacement but should be safe given the context
            new_content = content.replace(
                "userLevel === 'administrator'", 
                "userLevel === 'admin' || userLevel === 'administrator'"
            )
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Patched: {file_path}")
        else:
            print(f"Skipped (already patched or not found): {file_path}")
            
    except Exception as e:
        print(f"Error patching {file_path}: {e}")

base_dir = r'c:\CSHOP\unecorailelectric_20251204'

for relative_path in files_to_patch:
    full_path = os.path.join(base_dir, relative_path)
    patch_file(full_path)
