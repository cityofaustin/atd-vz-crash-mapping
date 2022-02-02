#!/usr/bin/perl

use strict;

#convert revised_diagram_icons.png -crop 200x200+0+0 test.png

my @colors = ('black', 'red', 'blue', 'yellow');

foreach my $color (@colors)
  {

  for (my $x = 0; $x < 10; $x++)
    {
    for (my $y = 0; $y < 10; $y++)
      {
      my $crop = 'convert crash_icons_' . $color . '.png -crop 200x200+' . $x * 200 . '+' . $y * 200 . " diagram_icons/colors/" . $color . "/" . sprintf('%02d', $x + 1) . 'x' . sprintf('%02d', $y + 1) . '.png';
      print $crop, "\n";
      `$crop`;
      }
    }

  }
