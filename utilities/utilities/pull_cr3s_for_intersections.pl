#!/usr/bin/perl

use strict;
use Data::Dumper;
use File::Path qw(make_path remove_tree);
use DBI;

my $pg  = DBI->connect("DBI:Pg:dbname=" . $ENV{'POSTGRES_DB'} . ";host=" . $ENV{'POSTGRES_HOSTNAME'} . ";port=" . $ENV{'POSTGRES_PORT'}, $ENV{'POSTGRES_USER'}, $ENV{'POSTGRES_PASSWORD'}, {RaiseError => 1});

my $pwd = `pwd`;
chomp($pwd);

# this should be an argument
my @aois = (44);

my $sql = "select * from diagram_aoi where id in (" . join (',', @aois) . ")";
my $query = $pg->prepare($sql);
$query->execute();
while (my $aoi = $query->fetchrow_hashref)
  {
  my $sql = "select i.id
             from diagram_intersections i
             join diagram_aoi a on (ST_Intersects(a.geometry, i.geometry))
             where 
             a.id in (" . join (',', @aois) . ")
             and a.id = ?";
  my $query = $pg->prepare($sql);
  $query->execute($aoi->{'id'});
  while (my $intersection = $query->fetchrow_hashref)
    {
    $aoi->{'name'} =~ s/\&/and/g;
    $aoi->{'name'} =~ s/\//-/g;
    $aoi->{'name'} =~ s/\s/_/g;
    my $path = '/root/CR3s_and_Spreadsheets/CR3s/' . $aoi->{'name'} . '/Section_' . $intersection->{'id'} . '/';
    print $path, "\n";


    make_path($path);

    my $sql = <<SQL;

    SELECT c.crash_id,
      atc.case_id,
      atc.at_intrsct_fl, 
      atc.crash_date, 
      atc.crash_time,
      csev.crash_sev_desc,
      atc.crash_speed_limit,
      atc.day_of_week,
      clsn.collsn_desc,
      atirl.intrsct_relat_desc,
      case 
        when atc.rpt_hwy_num is null then 
          concat(
            case when atc.rpt_street_pfx is not null then concat(atc.rpt_street_pfx, ' ') end,
            atc.rpt_street_name, 
            case when atc.rpt_street_sfx is not null then concat(' ', atc.rpt_street_sfx) end
            )
        when atc.rpt_street_name = 'NOT REPORTED' then 
          concat(
            case when atc.rpt_street_pfx is not null then concat(atc.rpt_street_pfx, ' ') end,
            atc.rpt_hwy_num, 
            case when atc.rpt_street_sfx is not null then concat(' ', atc.rpt_street_sfx) end
            )
        else atc.rpt_street_name
      end as normalized_street_name,
      case 
        when atc.rpt_sec_hwy_num is null then 
          concat(
            case when atc.rpt_sec_street_pfx is not null then concat(atc.rpt_sec_street_pfx, ' ') end,
            atc.rpt_sec_street_name, 
            case when atc.rpt_sec_street_sfx is not null then concat(' ', atc.rpt_sec_street_sfx) end
            )
        when atc.rpt_sec_street_name = 'NOT REPORTED' then 
          concat(
            case when atc.rpt_sec_street_pfx is not null then concat(atc.rpt_sec_street_pfx, ' ') end,
            atc.rpt_sec_hwy_num, 
            case when atc.rpt_sec_street_sfx is not null then concat(' ', atc.rpt_sec_street_sfx) end
            )
        else atc.rpt_sec_street_name
      end as normalized_second_street_name,
      atc.street_nbr,
      attcl.traffic_cntl_desc,
      atwcl.wthr_cond_desc,
      c.abbreviation as impact,
      (select string_agg(injuries.inj_count, ', ') as inj_count from (
        WITH persons AS (
          select crash_id, prsn_injry_sev_id from atd_txdot_primaryperson
            UNION ALL
          select crash_id, prsn_injry_sev_id from atd_txdot_person
          )
        SELECT concat(atisl.injry_sev_desc, ': ', count(*)) as inj_count
        from atd_txdot_crashes atc
        LEFT join persons p on (atc.crash_id = p.crash_id)
        left join atd_txdot__injry_sev_lkp atisl on (p.prsn_injry_sev_id = atisl.injry_sev_id)
        join (values (4,1), (99,2), (1,3), (2,4), (3,5), (5,6), (0,7), (94,8), (95,9)) as sorting (id, ordering) on (p.prsn_injry_sev_id = sorting.id)
        where atc.crash_id = c.crash_id
        group by atisl.injry_sev_desc, sorting.ordering
        order by sorting.ordering
      ) injuries) as injuries,
      (select string_agg(modes.mode_count, ', ') as mode_count from (
        select concat(atvudl.veh_unit_desc_desc , ': ', count(*)) as mode_count
        from atd_txdot_units atu
        LEFT JOIN atd_txdot__veh_unit_desc_lkp atvudl ON atvudl.veh_unit_desc_id = atu.unit_desc_id
        join(values (1,1), (4,2), (3,3), (5,4), (8,5), (2,6), (6,7), (7,1), (9,9), (94,10)) as sorting (id, ordering) on (atvudl.veh_unit_desc_id = sorting.id)
        where atu.crash_id = c.crash_id
        group by atvudl.veh_unit_desc_desc, sorting.ordering
        order by sorting.ordering
        ) modes) as modes,
      regexp_replace(atc.investigator_narrative_ocr, '[\r\n]', ' ') as narrative
    FROM latest_crash_data c
    LEFT JOIN atd_txdot_crashes atc ON (c.crash_id = atc.crash_id)
    LEFT JOIN diagram_intersections i ON (c.geometry && i.geometry and ST_Contains(i.geometry, c.geometry))
    LEFT JOIN atd_txdot__crash_sev_lkp csev ON (atc.crash_sev_id = csev.crash_sev_id)
    LEFT JOIN atd_txdot__collsn_lkp clsn ON (atc.fhe_collsn_id = clsn.collsn_id)
    LEFT JOIN atd_txdot__intrsct_relat_lkp atirl ON (atc.intrsct_relat_id = atirl.intrsct_relat_id)
    LEFT JOIN atd_txdot__traffic_cntl_lkp attcl ON (atc.traffic_cntl_id = attcl.traffic_cntl_id)
    LEFT JOIN atd_txdot__wthr_cond_lkp atwcl ON (atc.wthr_cond_id = atwcl.wthr_cond_id)
    WHERE i.id = ?

SQL

    my $query = $pg->prepare($sql);
    $query->execute($intersection->{'id'});
    while (my $crash = $query->fetchrow_hashref)
      {
      #print $crash->{'crash_id'}, "\n";
      my $cmd = 'aws s3 cp s3://atd-vision-zero-editor/production/cris-cr3-files/' . $crash->{'crash_id'} . '.pdf ' . $path . 'CR3s_and_Spreadsheets/' . $crash->{'crash_id'} . '.pdf';
      print $cmd, "\n";
      `$cmd`;
      }

    }
	}



