@REM ローカルでの確認用
@REM windows でローカルにある dist フォルダを nginx で配信するためのバッチファイル
@REM 使い方: serve.bat をダブルクリックして実行するだけ
echo Nginx is running on http://localhost:8080
@echo off
docker run --rm -p 8080:80 -v "%~dp0dist:/usr/share/nginx/html/ASB-web" -v "%~dp0nginx.conf:/etc/nginx/conf.d/default.conf" nginx
pause