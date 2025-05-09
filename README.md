# Problems
- pdf บางอันใน Google Drive เป็น empty pdf (https://drive.google.com/drive/folders/19zM9YaGfWB1NTx-pl4LoirNfRlyp81G0)
- ชื่อไฟล์ไม่เป็น standard มีอักขระพิเศษทำให้ process ไม่ได้ [()%&.] **(แก้ไขแล้ว)**
- บาง คณะ|สาขา ไม่มีเล่ม
- Hierarchical file system ไม่มี format ใครจะสร้าง sub-folder อะไรยังไงก็ได้
- MinIO Limit name object 1024 chr (https://min.io/docs/minio/linux/operations/concepts/thresholds.html)
- file format งงๆ (https://drive.google.com/drive/folders/1ci7v_DLLYXbfSCVV3UeLojNHW2nZSuk3)

# Model
- https://huggingface.co/BAAI/bge-m3

# Features
- Nurual Search & Full text Search
- Preview PDF 
- Download PDF
- Show metadata of PDF file

# Install
- Initial project
```bash
bash start.sh
```

# Preparing
- Migrate Google Drive to MinIO
```python
python backend/upload_minio.py
```

- Extract Text from PDF in minio (result in directory `data/`)
```python
python backend/extract_minio.py
```

- Upload data from JSON Lines to Qdrant vector with **BAAI/bge-m3** model.
```python
python backend/qdrant_upload.py
```

- Run FastAPI for search qdrant with API (This will be a execute `nerual_search.py` and `text_search.py`)
```python
python backend/service.py
```
# Run web
- Install the dependencies
```bash
cd frontend
npm install
```

- Build
```bash
npm run build
```

- Run locally
```bash
npm run start
```
# Congrate!
visit http://localhost:3000 to see it in action.
