#!/usr/bin/perl

use strict;
use JSON;
use CGI;
use Data::Dumper;
use DBI;

my $pg_dts  = DBI->connect("DBI:Pg:dbname=" . $ENV{'VZDB_RR_DB'} . ";host=" . $ENV{'VZDB_RR_DB_HOST'} . ";port=" . $ENV{'VZDB_RR_DB_PORT'}, $ENV{'VZDB_RR_DB_USERNAME'}, $ENV{'VZDB_RR_DB_PASSWORD'}, {RaiseError => 1});
my $pg  = DBI->connect("DBI:Pg:dbname=" . $ENV{'POSTGRES_DB'} . ";host=" . $ENV{'POSTGRES_HOSTNAME'} . ";port=" . $ENV{'POSTGRES_PORT'}, $ENV{'POSTGRES_USER'}, $ENV{'POSTGRES_PASSWORD'}, {RaiseError => 1});

my $sql = "select crash_id, latitude_primary, longitude_primary, ST_AsText(position) as location from atd_txdot_crashes where position is not null order by crash_date desc";
my $query = $pg_dts->prepare($sql);
$query->execute();
while (my $crash = $query->fetchrow_hashref)
  {
  #print Dumper $crash;

  my $sql = "select crash_id, ST_Distance(ST_Transform(position, 2277), ST_Transform(ST_GeomFromText(?, 4326), 2277)) as distance_feet from atd_txdot_crashes where crash_id = ? and ST_AsText(position) != ?";
  my $query = $pg->prepare($sql);
  $query->execute($crash->{'location'}, $crash->{'crash_id'}, $crash->{'location'});
  my $local_crash = $query->fetchrow_hashref;

  next unless $local_crash->{'crash_id'};

  #print $local_crash->{'crash_id'}, " ", $local_crash->{'distance_feet'}, "\n" if $local_crash->{'crash_id'};
  #print Dumper $local_crash if $local_crash->{'crash_id'};

  next unless $local_crash->{'distance_feet'} > 1;

  my $sql = "update atd_txdot_crashes set latitude_primary = ?, longitude_primary = ?, position = ST_GeomFromText(?, 4326) where crash_id = ?";
  my $query = $pg->prepare($sql);
  $query->execute($crash->{'latitude_primary'}, $crash->{'longitude_primary'}, $crash->{'location'}, $crash->{'crash_id'});
  print "Got one! - ", $local_crash->{'crash_id'}, " ", $local_crash->{'distance_feet'}, "\n";
  }
