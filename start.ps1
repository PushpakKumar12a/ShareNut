Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd d:\Data_Science\P2P\frontend; bun run dev"
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd d:\Data_Science\P2P\backend; .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
Write-Host 'Started frontend and backend in separate terminals.' -ForegroundColor Green