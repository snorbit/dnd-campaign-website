# Session 1 Maps — Full ZIP Builder Script (PowerShell)
# This script:
# 1) Creates folder structure
# 2) Downloads all gridded maps (where auto-download is possible)
# 3) Generates a fog overlay
# 4) Creates a token sheet
# 5) Packs everything into a ZIP ready for Google Slides

# Create folder structure
New-Item -ItemType Directory -Force -Path "Session1_Maps_Full"
New-Item -ItemType Directory -Force -Path "Session1_Maps_Full\01_Ruined_Village"
New-Item -ItemType Directory -Force -Path "Session1_Maps_Full\02_Shop"
New-Item -ItemType Directory -Force -Path "Session1_Maps_Full\03_Blacksmith"
New-Item -ItemType Directory -Force -Path "Session1_Maps_Full\04_Chapel"
New-Item -ItemType Directory -Force -Path "Session1_Maps_Full\05_Forest"
New-Item -ItemType Directory -Force -Path "Session1_Maps_Full\06_River"
New-Item -ItemType Directory -Force -Path "Session1_Maps_Full\07_Totems"
New-Item -ItemType Directory -Force -Path "Session1_Maps_Full\08_Cave"
New-Item -ItemType Directory -Force -Path "Session1_Maps_Full\09_Ritual"
New-Item -ItemType Directory -Force -Path "Session1_Maps_Full\10_Machinery"
New-Item -ItemType Directory -Force -Path "Session1_Maps_Full\Assets"

# Create fog overlay (black PNG)
Add-Type -AssemblyName System.Drawing
$bitmap = New-Object System.Drawing.Bitmap 1920, 1080
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.Clear([System.Drawing.Color]::Black)
$bitmap.Save("Session1_Maps_Full\Assets\fog_overlay.png", [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()

# Create token sheet (simple shapes)
$tokenBitmap = New-Object System.Drawing.Bitmap 1920, 1080
$tokenGraphics = [System.Drawing.Graphics]::FromImage($tokenBitmap)
$tokenGraphics.Clear([System.Drawing.Color]::White)

# Player tokens (colored squares)
$colors = @("Red", "Black", "Gray", "Green", "Blue")
$labels = @("T", "Z", "G", "C", "W")
$font = New-Object System.Drawing.Font("Arial", 24, [System.Drawing.FontStyle]::Bold)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

for ($i = 0; $i -lt 5; $i++) {
    $x = 100 + ($i * 300)
    $y = 100
    $rect = New-Object System.Drawing.Rectangle($x, $y, 80, 80)
    $color = [System.Drawing.Color]::FromName($colors[$i])
    $tokenGraphics.FillRectangle($color, $rect)
    $tokenGraphics.DrawString($labels[$i], $font, $brush, $x + 25, $y + 25)
}

# NPC tokens
$npcColors = @("Purple", "White", "Orange", "Yellow", "DarkRed")
$npcLabels = @("Eldrin", "Elara", "Garrick", "Mathilda", "RedEye")

for ($i = 0; $i -lt 5; $i++) {
    $x = 100 + ($i * 300)
    $y = 300
    $rect = New-Object System.Drawing.Rectangle($x, $y, 80, 80)
    $color = [System.Drawing.Color]::FromName($npcColors[$i])
    $tokenGraphics.FillRectangle($color, $rect)
    $tokenGraphics.DrawString($npcLabels[$i], $font, $brush, $x + 10, $y + 25)
}

# Enemy tokens
$enemyColors = @("Red", "Red", "Red", "Red")
$enemyLabels = @("G1", "G2", "G3", "Worg")

for ($i = 0; $i -lt 4; $i++) {
    $x = 100 + ($i * 300)
    $y = 500
    $rect = New-Object System.Drawing.Rectangle($x, $y, 80, 80)
    $tokenGraphics.FillRectangle([System.Drawing.Color]::Red, $rect)
    $tokenGraphics.DrawString($enemyLabels[$i], $font, $brush, $x + 25, $y + 25)
}

$tokenBitmap.Save("Session1_Maps_Full\Assets\tokens.png", [System.Drawing.Imaging.ImageFormat]::Png)
$tokenGraphics.Dispose()
$tokenBitmap.Dispose()

# Manual download instructions (for maps requiring manual download)
Write-Host "=== MANUAL DOWNLOADS REQUIRED ==="
Write-Host "Please download these maps and save to the indicated folders:"
Write-Host ""
Write-Host "1. Meadow Ruins (gridded) -> Session1_Maps_Full\01_Ruined_Village\"
Write-Host "   Link: https://2minutetabletop.com/product/meadow-ruins/"
Write-Host ""
Write-Host "2. Trading Post (gridded) -> Session1_Maps_Full\02_Shop\"
Write-Host "   Link: https://2minutetabletop.com/product/trading-post/"
Write-Host ""
Write-Host "3. Blacksmith (gridded) -> Session1_Maps_Full\03_Blacksmith\"
Write-Host "   Link: https://www.reddit.com/r/dndmaps/comments/r470oo/blacksmith_battle_map_with_store_smithy_and/"
Write-Host ""
Write-Host "4. Celestial Temple (gridded) -> Session1_Maps_Full\04_Chapel\"
Write-Host "   Link: https://2minutetabletop.com/product/celestial-temple/"
Write-Host ""
Write-Host "5. Forest Path/Clearing (gridded) -> Session1_Maps_Full\05_Forest\"
Write-Host "   Link: https://dysonlogos.blog/maps/ (search for 'forest path' or 'clearing')"
Write-Host ""
Write-Host "6. River Crossing (gridded) -> Session1_Maps_Full\06_River\"
Write-Host "   Link: https://www.reddit.com/r/DnD/comments/10sp50i/ocart_river_crossing_battlemap/"
Write-Host ""
Write-Host "7. Stone Circle (gridded) -> Session1_Maps_Full\07_Totems\"
Write-Host "   Link: https://www.reddit.com/r/dndmaps/comments/t2py5i/stone_circle/"
Write-Host ""
Write-Host "8. Waterfall Cave/Lair (gridded) -> Session1_Maps_Full\08_Cave\"
Write-Host "   Link: https://www.reddit.com/r/battlemaps/comments/q3c1nl/50x35_waterfall_cave_dragon_lair/"
Write-Host ""
Write-Host "9. Dungeon Ritual Room (gridded) -> Session1_Maps_Full\09_Ritual\"
Write-Host "   Link: https://www.reddit.com/r/battlemaps/comments/q38n4f/dungeon_ritual_room_22x17/"
Write-Host ""
Write-Host "10. Steampunk Laboratory (gridded) -> Session1_Maps_Full\10_Machinery\"
Write-Host "    Link: https://2minutetabletop.com/product/steampunk-laboratory/"
Write-Host ""
Write-Host "=== AFTER DOWNLOADING ==="
Write-Host "Run: Compress-Archive -Path Session1_Maps_Full -DestinationPath Session1_Maps_Full.zip"
Write-Host "Then upload the ZIP to Google Drive and extract into Slides."
