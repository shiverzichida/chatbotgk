import os
import sys

def load_env_local(env_path):
    if not os.path.exists(env_path):
        print(f"Error: env file not found at {env_path}")
        return
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, val = line.split('=', 1)
                val = val.strip().strip("'").strip('"')
                os.environ[key.strip()] = val

# Load credentials
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env.local')
load_env_local(env_path)

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: credentials missing")
    sys.exit(1)

try:
    from supabase import create_client
    client = create_client(url, key)
    res = client.table("document_chunks").select("id, chapter_title, page_start").limit(10).execute()
    print("Result Data:", res.data)
except Exception as e:
    print("Error:", e)
