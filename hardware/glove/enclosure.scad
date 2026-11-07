// GestureTalk Glove — electronics pod (OpenSCAD). Print in PETG, 0.2 mm, no supports.
// Two parts: base (print as-is) and lid (set PART = "lid").
PART = "base";            // "base" | "lid"
inner = [46, 32, 13];     // fits a 3x4 cm perfboard + XIAO + 500 mAh Li-Po underneath
wall = 1.8;
r = 3;                    // corner radius
strap_w = 26;             // Velcro strap width

module rbox(s, rad) {
  hull() for (x = [rad, s[0]-rad], y = [rad, s[1]-rad]) translate([x, y, 0]) cylinder(r=rad, h=s[2], $fn=32);
}

module base() {
  outer = [inner[0]+2*wall, inner[1]+2*wall, inner[2]+wall];
  difference() {
    rbox(outer, r);
    translate([wall, wall, wall]) rbox([inner[0], inner[1], inner[2]+1], r-1);
    // USB-C (XIAO at the short end)
    translate([-1, outer[1]/2-5, wall+3]) cube([wall+2, 10, 4.5]);
    // slide switch
    translate([outer[0]-wall-1, 6, wall+5]) cube([wall+2, 9, 4]);
    // sensor cable exit (toward the fingers)
    translate([outer[0]-wall-1, outer[1]-14, wall+2]) cube([wall+2, 8, 4]);
  }
  // strap loops on the bottom
  for (x = [4, outer[0]-8]) translate([x, (outer[1]-strap_w)/2-2, -3]) difference() {
    cube([4, strap_w+4, 3]);
    translate([-1, 2, -1]) cube([6, strap_w, 3]);
  }
}

module lid() {
  outer = [inner[0]+2*wall, inner[1]+2*wall, wall];
  difference() {
    union() {
      rbox(outer, r);
      translate([wall+0.2, wall+0.2, wall]) rbox([inner[0]-0.4, inner[1]-0.4, 2], r-1); // friction lip
    }
    // calibrate button hole
    translate([outer[0]/2, outer[1]/2, -1]) cylinder(d=4, h=10, $fn=24);
  }
}

if (PART == "base") base(); else lid();
