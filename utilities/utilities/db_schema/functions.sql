CREATE OR REPLACE FUNCTION public.make_overview_table(aoi integer)
 RETURNS character varying
 LANGUAGE plperl
AS $function$
my @colors = ('blue','yellow', 'red', 'black');
my %colors = ('blue' => '#0000ff', 'yellow' => '#8f9401', 'red' => '#ff0000', 'black' => '#000000');
my $html = "";
$html .= "<style>\n";
$html .= "table {\n";
$html .= "  border-collapse: collapse;\n";
$html .= "}\n";
$html .= "thead td {\n";
$html .= "  text-align:center;\n";
$html .= "}\n";
$html .= "td {\n";
$html .= "  border: 1px solid black;\n";
$html .= "  margin: 0;\n";
$html .= "  padding: 2px;\n";
$html .= "  font-family: sans-serif;\n";
$html .= "  font-size: 10px;\n";
$html .= "  background: #ffffff;\n";
$html .= "  }\n";
$html .= "td.center {\n";
$html .= "  text-align:center;\n";
$html .= "  }\n";
$html .= ".blue { color: $colors{'blue'}; }\n";
$html .= ".yellow { color: $colors{'yellow'}; }\n";
$html .= ".red { color: $colors{'red'}; }\n";
$html .= ".black { color: $colors{'black'}; }\n";
$html .= "</style>\n";
$html .= "<table>\n";
$html .= "<thead>\n";
$html .= "<tr>\n";
$html .= "<td>Legend</td>\n";
$html .= "<td class=\"blue\">Fatal</td>\n";
$html .= "<td class=\"yellow\">Serious Injury</td>\n";
$html .= "<td class=\"red\">Injury</td>\n";
$html .= "<td class=\"black\">PDO</td>\n";
$html .= "<td class=\"black\">Total</td>\n";
$html .= "</tr>\n";
$html .= "</thead>\n";
my $rv = spi_exec_query('
select distinct description, abbreviation, count(id)
from latest_crash_data lcd
join diagram_aoi da on (lcd.geometry && da.geometry and ST_Contains(da.geometry, lcd.geometry))
where da.id = ' . $_[0] . '
group by description, abbreviation
order by count(id) desc
');
my $status = $rv->{status};
my $nrows = $rv->{processed};
foreach my $rn (0 .. $nrows - 1) {
  my $row = $rv->{rows}[$rn];
  my $total = 0;
  $html .= "<tr>\n";
  $html .= "<td>" . $row->{'description'} . "</td>\n";
  foreach my $color (@colors) {
    my $rv = spi_exec_query("select lcd.icon_color, count(lcd.icon_color)
      from latest_crash_data lcd
      join diagram_aoi da on (lcd.geometry && da.geometry and ST_Contains(da.geometry, lcd.geometry))
      where da.id = " . $_[0] . "
        and lcd.description = '" . $row->{'description'} . "'
        and lcd.icon_color = '" . $color . "'
      group by lcd.icon_color
      order by position(lcd.icon_color in 'blue, yellow, red, black') asc");
    my $status = $rv->{status};
    my $nrows = $rv->{processed};
    my $row = $rv->{rows}[0];
    $row->{'count'} += 0;
    $html .= "<td class='center " . $color . "'>" . $row->{'count'} . "</td>\n";
    $total += $row->{'count'};
    }
  $html .= "<td class='center black'>" . $total . "</td>\n";
  $html .= "</tr>\n";
  }
$html .= "</table>\n";
return $html;
$function$
;


CREATE OR REPLACE FUNCTION public.make_intersection_table(intersection integer)
 RETURNS character varying
 LANGUAGE plperl
AS $function$
my @colors = ('blue','yellow', 'red', 'black');
my %colors = ('blue' => '#0000ff', 'yellow' => '#8f9401', 'red' => '#ff0000', 'black' => '#000000');
my $html = "";
$html .= "<style>\n";
$html .= "table {\n";
$html .= "  border-collapse: collapse;\n";
$html .= "}\n";
$html .= "thead td {\n";
$html .= "  text-align:center;\n";
$html .= "}\n";
$html .= "td {\n";
$html .= "  border: 1px solid black;\n";
$html .= "  margin: 0;\n";
$html .= "  padding: 2px;\n";
$html .= "  font-family: sans-serif;\n";
$html .= "  font-size: 10px;\n";
$html .= "  background: #ffffff;\n";
$html .= "  }\n";
$html .= "td.center {\n";
$html .= "  text-align:center;\n";
$html .= "  }\n";
$html .= "</style>\n";
$html .= "<table>\n";
my $rv = spi_exec_query('
select distinct lcd.description, lcd.abbreviation, count(id)
from latest_crash_data lcd
join diagram_intersections di on (lcd.geometry && di.geometry and ST_Contains(di.geometry, lcd.geometry))
where di.id = ' . $_[0] . '
group by lcd.description, lcd.abbreviation
order by count(id) desc
');
my $status = $rv->{status};
my $nrows = $rv->{processed};
foreach my $rn (0 .. $nrows - 1) {
  my $row = $rv->{rows}[$rn];
  $html .= "<tr>\n";
  $html .= "<td>" . $row->{'abbreviation'} . "</td>\n";
    my $rv = spi_exec_query("select count(di.id)
      from latest_crash_data lcd
      join diagram_intersections di on (lcd.geometry && di.geometry and ST_Contains(di.geometry, lcd.geometry))
      where di.id = " . $_[0] . "
      and lcd.abbreviation = '" . $row->{'abbreviation'} . "'");
    my $status = $rv->{status};
    my $nrows = $rv->{processed};
    my $row = $rv->{rows}[0];
    $row->{'count'} += 0;
    $html .= "<td class='center'>" . $row->{'count'} . "</td>\n";
    $html .= "</tr>\n";
    }
$html .= "</table>\n";  
return $html;
$function$
;


CREATE OR REPLACE FUNCTION public.refresh_mv_diagram_aoi_with_labels()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
  begin
    refresh materialized view diagram_aoi_with_labels;
  RETURN NULL;
  END $function$
;

CREATE OR REPLACE FUNCTION public.refresh_mv_diagram_intersections_with_labels()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
  begin
    refresh materialized view diagram_intersections_with_labels;
  RETURN NULL;
  END $function$
;


