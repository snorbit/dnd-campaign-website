# Session 1 Maps — Quick Download Links

## Folder structure to create
```
Session1_Maps_Full/
├─ 01_Ruined_Village/
├─ 02_Shop/
├─ 03_Blacksmith/
├─ 04_Chapel/
├─ 05_Forest/
├─ 06_River/
├─ 07_Totems/
├─ 08_Cave/
├─ 09_Ritual/
├─ 10_Machinery/
└─ Assets/
```

---

## Download links (gridded versions)

### 1) Ruined Village / Square
- **Link**: https://2minutetabletop.com/product/meadow-ruins/
- **Save to**: `Session1_Maps_Full\01_Ruined_Village\`
- **File**: Meadow Ruins (gridded version)

### 2) Shop (Hawthorn & Wick)
- **Link**: https://2minutetabletop.com/product/trading-post/
- **Save to**: `Session1_Maps_Full\02_Shop\`
- **File**: Trading Post (gridded version)

### 3) Blacksmith / Forge
- **Link**: https://www.reddit.com/r/dndmaps/comments/r470oo/blacksmith_battle_map_with_store_smithy_and/
- **Save to**: `Session1_Maps_Full\03_Blacksmith\`
- **File**: Blacksmith Battle Map (gridded version)

### 4) Chapel / Temple
- **Link**: https://2minutetabletop.com/product/celestial-temple/
- **Save to**: `Session1_Maps_Full\04_Chapel\`
- **File**: Celestial Temple (gridded version)

### 5) Forest Path / Clearing
- **Link**: https://dysonlogos.blog/maps/
- **Save to**: `Session1_Maps_Full\05_Forest\`
- **File**: Choose any “forest path” or “clearing” map (gridded)

### 6) River Crossing / Ambush
- **Link**: https://www.reddit.com/r/DnD/comments/10sp50i/ocart_river_crossing_battlemap/
- **Save to**: `Session1_Maps_Full\06_River\`
- **File**: River Crossing (gridded version)

### 7) Totem Maze / Standing Stones
- **Link**: https://www.reddit.com/r/dndmaps/comments/t2py5i/stone_circle/
- **Save to**: `Session1_Maps_Full\07_Totems\`
- **File**: Stone Circle (gridded version)

### 8) Cave Entrance / Lair
- **Link**: https://www.reddit.com/r/battlemaps/comments/q3c1nl/50x35_waterfall_cave_dragon_lair/
- **Save to**: `Session1_Maps_Full\08_Cave\`
- **File**: Waterfall Cave/Lair (gridded version)

### 9) Ritual Chamber / Dome
- **Link**: https://www.reddit.com/r/battlemaps/comments/q38n4f/dungeon_ritual_room_22x17/
- **Save to**: `Session1_Maps_Full\09_Ritual\`
- **File**: Dungeon Ritual Room (gridded version)

### 10) Machinery / Audit Room
- **Link**: https://2minutetabletop.com/product/steampunk-laboratory/
- **Save to**: `Session1_Maps_Full\10_Machinery\`
- **File**: Steampunk Laboratory (gridded version)

---

## PowerShell commands (run after downloads)

### Create fog overlay
```powershell
Add-Type -AssemblyName System.Drawing
$bitmap = New-Object System.Drawing.Bitmap 1920, 1080
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.Clear([System.Drawing.Color]::Black)
$bitmap.Save("Session1_Maps_Full\Assets\fog_overlay.png", [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
```

### Create token sheet
```powershell
$tokenBitmap = New-Object System.Drawing.Bitmap 1920, 1080
$tokenGraphics = [System.Drawing.Graphics]::FromImage($tokenBitmap)
$tokenGraphics.Clear([System.Drawing.Color]::White)
$font = New-Object System.Drawing.Font("Arial", 24, [System.Drawing.FontStyle]::Bold)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

# Player tokens
$colors = @("Red", "Black", "Gray", "Green", "Blue")
$labels = @("T", "Z", "G", "C", "W")
for ($i = 0; $i -lt 5; $i++) {
    $x = 100 + ($i * 300)
    $y = 100
    $rect = New-Object System.Drawing.Rectangle($x, $y, 80, 80)
    $tokenGraphics.FillRectangle([System.Drawing.Color]::FromName($colors[$i]), $rect)
    $tokenGraphics.DrawString($labels[$i], $font, $brush, $x + 25, $y + 25)
}

# NPC tokens
$npcColors = @("Purple", "White", "Orange", "Yellow", "DarkRed")
$npcLabels = @("Eldrin", "Elara", "Garrick", "Mathilda", "RedEye")
for ($i = 0; $i -lt 5; $i++) {
    $x = 100 + ($i * 300)
    $y = 300
    $rect = New-Object System.Drawing.Rectangle($x, $y, 80, 80)
    $tokenGraphics.FillRectangle([System.Drawing.Color]::FromName($npcColors[$i]), $rect)
    $tokenGraphics.DrawString($npcLabels[$i], $font, $brush, $x + 10, $y + 25)
}

# Enemy tokens
for ($i = 0; $i -lt 4; $i++) {
    $x = 100 + ($i * 300)
    $y = 500
    $rect = New-Object System.Drawing.Rectangle($x, $y, 80, 80)
    $tokenGraphics.FillRectangle([System.Drawing.Color]::Red, $rect)
    $tokenGraphics.DrawString(("G" + ($i+1)), $font, $brush, $x + 25, $y + 25)
}
$tokenGraphics.DrawString("Worg", $font, $brush, 1300, 500)

$tokenBitmap.Save("Session1_Maps_Full\Assets\tokens.png", [System.Drawing.Imaging.ImageFormat]::Png)
$tokenGraphics.Dispose()
$tokenBitmap.Dispose()
```

### Create ZIP
```powershell
Compress-Archive -Path Session1_Maps_Full -DestinationPath Session1_Maps_Full.zip
```

---

## Done!
You now have:
- All maps in order
- Fog overlay
- Token sheet
- ZIP ready for Google Slides
