@echo off

:: Configuración para Farmacorp - Sucursal Central (Puerto 3000)
start "Farmacorp - Central" env-cmd -e central npm run dev

:: Configuración para Farmacorp - Sucursal Norte (Puerto 3001)
:: start "Farmacorp - Norte" env-cmd -e norte npm run dev -- -p 3001

:: Configuración para Farmacorp - Sucursal Sur (Puerto 3002)
:: start "Farmacorp - Sur" env-cmd -e sur npm run dev -- -p 3002
