import json
import argparse
import os

def parse_args():
    parser = argparse.ArgumentParser(description="Segggguwaaaa")
    parser.add_argument("-f", "--file", required=True)
    parser.add_argument("-i", "--ip", required=True)
    return parser.parse_args()

def extract_fields(record):
    alert = record.get("alert", {})
    metadata = alert.get("metadata", {})

    return {
        "src_ip": record.get("src_ip"),
        "src_port": record.get("src_port"),
        "dest_ip": record.get("dest_ip"),
        "dest_port": record.get("dest_port"),
        "proto": record.get("proto"),
        "app_proto": record.get("app_proto"),
        "signature": alert.get("signature"),
        "category": alert.get("category"),
        "action": alert.get("action"),
        "created_at": metadata.get("created_at")
    }

def main():
    args = parse_args()
    input_file = args.file
    filter_ip = args.ip

    results = []

    with open(input_file, "r") as f:
        try:
            data = json.load(f)
            for record in data:
                if record.get("src_ip") == filter_ip:
                    results.append(extract_fields(record))
        except json.JSONDecodeError:
            f.seek(0)
            for line in f:
                if line.strip():
                    record = json.loads(line)
                    if record.get("src_ip") == filter_ip:
                        results.append(extract_fields(record))

    output_file = f"{filter_ip}.json"

    with open(output_file, "w") as out:
        json.dump(results, out, indent=4)

    print(f"Done! Found {len(results)} records.")
    print(f"Output saved to: {output_file}")

if __name__ == "__main__":
    main()
