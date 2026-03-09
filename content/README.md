# Content Sources

Place source files for the public archive here.

Routine updates should go through `admin/index.html`. Keep this folder for bulk imports, handoff files, or source workbooks that need to be preserved.

Recommended layout:

```text
content/
  source/
    lecture-archives.xlsx
```

The public site does not read these files directly. Instead, convert the workbook into `public/data/site-content.js` with:

```bash
python3 scripts/import_archives_from_xlsx.py --source content/source/lecture-archives.xlsx
```

After the import finishes, open `public/index.html` and verify the updated archive cards, filters, and links.
