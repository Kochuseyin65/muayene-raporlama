#!/usr/bin/env python3
"""
Create a sample Equipment with a rich template that covers all section types.

Usage:
  python scripts/create_example_equipment.py \
    --api http://localhost:3000/api \
    --email admin@abc.com --password password \
    --name "Kule Vinç - Örnek" --type "Kule Vinç"

Requires: pip install requests
"""

import argparse
import os
import sys
import json
import requests


def build_template():
    """Return a template object that exercises all supported section types.

    Supported (typed) section types in backend validator:
      - key_value (items[] with name, valueType, options for select)
      - checklist (questions[] with name, label, options)
      - table (columns[] with name, label)
      - photos (field)
      - notes (field)
    """
    return {
        "sections": [
            {
                "title": "Genel Bilgiler",
                "type": "key_value",
                "items": [
                    {"name": "imalatci", "label": "İmalatçı", "valueType": "text"},
                    {"name": "model", "label": "Model", "valueType": "text"},
                    {"name": "seri_no", "label": "Seri No", "valueType": "text"},
                    {"name": "uretim_tarihi", "label": "Üretim Tarihi", "valueType": "date"},
                    {"name": "calisma_ortami", "label": "Çalışma Ortamı", "valueType": "select",
                     "options": [
                         {"label": "İç Mekan", "value": "ic"},
                         {"label": "Dış Mekan", "value": "dis"}
                     ]},
                    {"name": "azami_kapasite_ton", "label": "Azami Kapasite (ton)", "valueType": "number"},
                ]
            },
            {
                "title": "Güvenlik Kontrolleri",
                "type": "checklist",
                "questions": [
                    {"name": "emniyet_switch", "label": "Emniyet Switch", "options": ["Uygun", "Uygun Değil", "N/A"]},
                    {"name": "limit_switch", "label": "Limit Switch", "options": ["Uygun", "Uygun Değil", "N/A"]},
                    {"name": "halat_durumu", "label": "Halat Durumu", "options": ["Uygun", "Uygun Değil", "N/A"]},
                    {"name": "kanca_durumu", "label": "Kanca Durumu", "options": ["Uygun", "Uygun Değil", "N/A"]},
                ]
            },
            {
                "title": "Teknik Değerler",
                "type": "key_value",
                "items": [
                    {"name": "maksimum_yukseklik_m", "label": "Maksimum Yükseklik (m)", "valueType": "number"},
                    {"name": "bom_uzunlugu_m", "label": "Bom Uzunluğu (m)", "valueType": "number"},
                    {"name": "kullanim_amaci", "label": "Kullanım Amacı", "valueType": "text"},
                    {"name": "son_bakim_tarihi", "label": "Son Bakım Tarihi", "valueType": "date"}
                ]
            },
            {
                "title": "Bakım / Servis Kayıtları",
                "type": "table",
                "field": "bakim_kayitlari",
                "columns": [
                    {"name": "tarih", "label": "Tarih"},
                    {"name": "islem", "label": "İşlem"},
                    {"name": "teknisyen", "label": "Teknisyen"},
                    {"name": "not", "label": "Not"}
                ]
            },
            {
                "title": "Fotoğraflar",
                "type": "photos",
                "field": "genel_gorunum",
                "display": "grid",
                "maxCount": 12
            },
            {
                "title": "Ek Notlar",
                "type": "notes",
                "field": "ek_notlar"
            }
        ]
    }


def login(api, email, password):
    r = requests.post(f"{api}/auth/login", json={"email": email, "password": password})
    r.raise_for_status()
    js = r.json()
    if not js.get("success"):
        raise RuntimeError(f"Login failed: {js}")
    # CODEBASE returns { success, data: { token, user } }
    token = js.get("data", {}).get("token") or js.get("token")
    if not token:
        raise RuntimeError("Token not found in login response")
    return token


def create_equipment(api, token, name, typ, template):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {"name": name, "type": typ, "template": template}
    r = requests.post(f"{api}/equipment", headers=headers, data=json.dumps(payload))
    r.raise_for_status()
    js = r.json()
    if not js.get("success"):
        raise RuntimeError(f"Create equipment failed: {js}")
    return js["data"]


def main():
    parser = argparse.ArgumentParser(description="Create sample equipment with a rich template")
    parser.add_argument("--api", default=os.getenv("API", "http://localhost:3000/api"), help="API base url, e.g. http://localhost:3000/api")
    parser.add_argument("--email", default=os.getenv("EMAIL", "admin@abc.com"))
    parser.add_argument("--password", default=os.getenv("PASSWORD", "password"))
    parser.add_argument("--name", default="Örnek Ekipman — Kule Vinç")
    parser.add_argument("--type", dest="etype", default="Kule Vinç")
    args = parser.parse_args()

    tpl = build_template()
    try:
        token = login(args.api, args.email, args.password)
        data = create_equipment(args.api, token, args.name, args.etype, tpl)
        print("Success: equipment created.")
        print(json.dumps(data, ensure_ascii=False, indent=2))
    except requests.HTTPError as e:
        print("HTTP error:", e, file=sys.stderr)
        if e.response is not None:
            try:
                print(e.response.status_code, e.response.text, file=sys.stderr)
            except Exception:
                pass
        sys.exit(1)
    except Exception as e:
        print("Error:", e, file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

