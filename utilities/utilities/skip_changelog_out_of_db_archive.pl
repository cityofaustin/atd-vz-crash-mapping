#!/usr/bin/perl

use strict;

my $skip = 0;
while (my $line = <>)
  {
  $skip = 0 if ($line =~ /^COPY/i);
  $skip = 1 if ($line =~ /COPY public.atd_txdot_change_log/i and !$skip);
  print $line unless $skip;
  }

