import json
import time
from datetime import datetime, timedelta, timezone

from bs4 import BeautifulSoup

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


BASE = "https://efdsearch.senate.gov"
OUTFILE = "senateTrades.json"


def parse_mmddyyyy(s: str):
    s = (s or "").strip()
    try:
        return datetime.strptime(s, "%m/%d/%Y").date()
    except Exception:
        return None


def extract_table_rows_as_dicts(soup):
    """Extract table rows as dicts by reading header labels (th) and zipping them to td cells."""
    tables = soup.find_all("table")
    dict_rows = []

    for table in tables:
        # try to get headers
        headers = []
        thead = table.find("thead")
        if thead:
            headers = [th.get_text(" ", strip=True) for th in thead.find_all("th")]
        else:
            # fallback: first row might be headers
            first_tr = table.find("tr")
            if first_tr:
                ths = first_tr.find_all("th")
                if ths:
                    headers = [th.get_text(" ", strip=True) for th in ths]

        # Only consider tables that look like the transactions table
        header_blob = " | ".join([h.lower() for h in headers])
        looks_like_tx = (
            "transaction" in header_blob and
            ("amount" in header_blob or "amount range" in header_blob) and
            ("owner" in header_blob or "ownership" in header_blob)
        )
        if not looks_like_tx:
            continue

        body_rows = table.find_all("tr")
        for tr in body_rows:
            tds = tr.find_all("td")
            if not tds:
                continue

            cells = [td.get_text(" ", strip=True) for td in tds]

            # if headers length mismatch, skip
            if headers and len(headers) == len(cells):
                row = dict(zip(headers, cells))
            else:
                # fallback: still return indexed keys
                row = {f"col_{i}": v for i, v in enumerate(cells)}

            dict_rows.append(row)

    return dict_rows


def pick(row, keys):
    """Pick the first non-empty value from row matching any of the given keys."""
    for k in keys:
        if k in row and row[k]:
            return row[k]
    return None


def normalize_trade_row(row):
    """Normalize a dict-row from PTR table into Politeia record format."""
    # these header names can vary; handle common variants
    transaction_date = pick(row, [
        "Transaction Date", "Transaction date", "Date", "Trade Date"
    ])

    owner = pick(row, [
        "Owner", "Ownership", "Owner/Spouse", "Owner Name"
    ])

    ticker = pick(row, [
        "Ticker", "Ticker Symbol", "Symbol"
    ])

    asset = pick(row, [
        "Asset Name", "Asset", "Description"
    ])

    asset_type = pick(row, [
        "Asset Type", "Type of Asset", "Asset Class"
    ])

    tx_type = pick(row, [
        "Transaction Type", "Transaction", "Type"
    ])

    amount = pick(row, [
        "Amount", "Amount Range", "Value"
    ])

    return {
        "transactionDate": transaction_date,
        "owner": owner,
        "ticker": ticker,
        "asset": asset,
        "assetType": asset_type,
        "type": tx_type,
        "amount": amount,
    }


def main():
    cutoff = (datetime.now(timezone.utc).date() - timedelta(days=365 * 4))

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
    wait = WebDriverWait(driver, 30)

    try:
        # 1) Open home + accept agreement
        driver.get(f"{BASE}/search/home/")
        time.sleep(1.5)

        try:
            wait.until(EC.element_to_be_clickable((By.ID, "agree_statement"))).click()
            print("Clicked agreement checkbox")
        except Exception:
            print("Agreement checkbox not shown (maybe already accepted)")

        # Select Senator filer type (required)
        try:
            wait.until(EC.element_to_be_clickable((By.ID, "filerTypeLabelSenator"))).click()
            print("Selected filer type: Senator")
        except Exception:
            # fallback
            driver.find_element(By.XPATH, "//label[contains(.,'Senator')]").click()
            print("Selected filer type via label text: Senator")

        # Submit
        driver.find_element(By.CSS_SELECTOR, 'button[type="submit"].btn-primary').click()
        print("Submitted agreement/search landing form")

        # Wait for DataTables next button and rows to exist (important)
        wait.until(EC.presence_of_element_located((By.ID, "filedReports")))
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".paginate_button.next")))
        # Wait until at least 1 row appears
        wait.until(lambda d: len(d.find_elements(By.CSS_SELECTOR, "#filedReports tbody tr")) > 0)

        print("Results table loaded with rows")

        # -----------------------------
        # JS-driven pagination scrape
        # -----------------------------
        seen_links = set()
        all_reports = []

        def get_current_rows():
            return driver.execute_script("""
              const table = document.querySelector('#filedReports');
              if (!table) return [];

              const rows = table.querySelectorAll('tbody tr');
              const out = [];

              rows.forEach(row => {
                const tds = row.querySelectorAll('td');
                if (!tds || tds.length < 5) return;

                const firstName = (tds[0].innerText || '').trim();
                const lastName  = (tds[1].innerText || '').trim();
                const office    = (tds[2].innerText || '').trim();

                // Report cell has anchor
                const a = tds[3].querySelector('a');
                if (!a) return;

                const reportTitle = (a.innerText || '').trim();
                const reportLink  = (a.getAttribute('href') || '').trim();
                const reportDate  = (tds[4].innerText || '').trim();

                out.push({ firstName, lastName, office, reportTitle, reportLink, reportDate });
              });

              return out;
            """)

        def click_next():
            return driver.execute_script("""
              const nextBtn = document.querySelector('.paginate_button.next');
              if (!nextBtn) return false;
              if (nextBtn.classList.contains('disabled')) return false;
              nextBtn.click();
              return true;
            """)

        pages = 0
        while True:
            pages += 1

            # ensure rows exist before scraping
            wait.until(lambda d: len(d.find_elements(By.CSS_SELECTOR, "#filedReports tbody tr")) > 0)

            page_rows = get_current_rows()

            added = 0
            for r in page_rows:
                link = (r.get("reportLink") or "")
                if link and link not in seen_links:
                    seen_links.add(link)
                    all_reports.append(r)
                    added += 1

            print(f"Pages: {pages} | Added: {added} | Total reports: {len(all_reports)}")

            if not click_next():
                print("Next disabled or not found; done paginating.")
                break

            # wait for table redraw
            time.sleep(0.8)

        print("Total reports found (all types):", len(all_reports))

        # 3) Filter to PTR only + last 4 years
        ptr_reports = []
        for r in all_reports:
            title = (r.get("reportTitle") or "").strip()
            link = (r.get("reportLink") or "").strip()
            date_str = (r.get("reportDate") or "").strip()
            d = parse_mmddyyyy(date_str)

            if "Periodic Transaction Report" not in title and "/ptr/" not in link:
                continue
            if d and d < cutoff:
                continue

            full = link if link.startswith("http") else (BASE + link)
            ptr_reports.append({
                "senator": f"{r.get('firstName','').strip()} {r.get('lastName','').strip()}".strip(),
                "office": r.get("office"),
                "reportTitle": title,
                "reportDate": d.isoformat() if d else None,
                "reportUrl": full
            })

        print("PTR reports in last 4 years:", len(ptr_reports))

        # 4) Parse each PTR for trades
        trades = []
        for i, rep in enumerate(ptr_reports, start=1):
            if i % 25 == 0:
                print(f"Parsing {i}/{len(ptr_reports)} PTRs... trades so far: {len(trades)}")

            driver.get(rep["reportUrl"])
            time.sleep(0.7)

            soup = BeautifulSoup(driver.page_source, "html.parser")

            tx_rows = extract_table_rows_as_dicts(soup)

            for r in tx_rows:
                t = normalize_trade_row(r)

                # require at least date + asset to keep noise down
                if not t["transactionDate"] or not t["asset"]:
                    continue

                trades.append({
                    "senator": rep["senator"],
                    "office": rep.get("office"),
                    "reportTitle": rep.get("reportTitle"),
                    "reportDate": rep.get("reportDate"),
                    "reportUrl": rep.get("reportUrl"),
                    **t
                })

            time.sleep(0.1)

        print("Total trades parsed:", len(trades))

        with open(OUTFILE, "w", encoding="utf-8") as f:
            json.dump(trades, f, indent=2, ensure_ascii=False)

        print("Saved:", OUTFILE)

    finally:
        try:
            driver.quit()
        except Exception:
            pass


if __name__ == "__main__":
    main()
