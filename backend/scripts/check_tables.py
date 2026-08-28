import sqlite3

def main():
    conn = sqlite3.connect("classroom_db.sqlite")
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [r[0] for r in cursor.fetchall()]
    print("Database tables:")
    for t in sorted(tables):
        cursor.execute(f"SELECT COUNT(*) FROM {t};")
        count = cursor.fetchone()[0]
        print(f" - {t:<25} : {count} rows")
    conn.close()

if __name__ == "__main__":
    main()
