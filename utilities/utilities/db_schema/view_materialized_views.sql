CREATE OR REPLACE VIEW public.latest_crash_data
AS WITH persons AS (
         SELECT atd_txdot_primaryperson.crash_id,
            atd_txdot_primaryperson.prsn_injry_sev_id
           FROM atd_txdot_primaryperson
          WHERE atd_txdot_primaryperson.prsn_injry_sev_id = ANY (ARRAY[4, 1, 2])
        UNION ALL
         SELECT atd_txdot_person.crash_id,
            atd_txdot_person.prsn_injry_sev_id
           FROM atd_txdot_person
          WHERE atd_txdot_person.prsn_injry_sev_id = ANY (ARRAY[4, 1, 2])
        ), latest_crash_data AS (
         SELECT latest_crash_data.diagram_id,
            latest_crash_data.crash_id,
            latest_crash_data.icon,
            latest_crash_data.angle,
            latest_crash_data.angle_degrees,
            latest_crash_data.geometry
           FROM ( SELECT DISTINCT ON (c_1.crash_id) c_1.id AS diagram_id,
                    c_1.crash_id,
                    c_1.icon,
                    c_1.angle,
                    c_1.angle * ('-180'::integer::double precision / pi()) AS angle_degrees,
                    c_1.geometry
                   FROM diagram_crashes c_1
                  WHERE c_1.geometry IS NOT NULL AND c_1.hide_crash = 0
                  ORDER BY c_1.crash_id) latest_crash_data
        )
 SELECT c.diagram_id,
    c.crash_id,
    c.icon,
    dicm.abbreviation,
    dicm.description,
    c.angle,
    c.angle_degrees,
    c.geometry,
        CASE
            WHEN count(p.crash_id) FILTER (WHERE p.prsn_injry_sev_id = 4) > 0 THEN 'blue'::text
            WHEN count(p.crash_id) FILTER (WHERE p.prsn_injry_sev_id = 1) > 0 THEN 'yellow'::text
            WHEN count(p.crash_id) FILTER (WHERE p.prsn_injry_sev_id = 2) > 0 THEN 'red'::text
            ELSE 'black'::text
        END AS icon_color
   FROM latest_crash_data c
     LEFT JOIN persons p ON p.crash_id = c.crash_id
     LEFT JOIN diagram_icon_crash_map dicm ON c.icon::text = dicm.icon::text
  GROUP BY c.diagram_id, c.crash_id, c.icon, c.angle, c.angle_degrees, dicm.abbreviation, dicm.description, c.geometry;

DROP VIEW cr3_nonproper_crashes_on_mainlane;

CREATE MATERIALIZED VIEW public.cr3_nonproper_crashes_on_mainlane
TABLESPACE pg_default
AS WITH cr3_mainlanes AS (
         SELECT st_transform(st_buffer(st_transform(st_union(cr3_mainlanes.geometry), 2277), 1::double precision), 4326) AS geometry
           FROM public.cr3_mainlanes
        ), seek_direction AS (
         SELECT c_1.crash_id,
                CASE
                    WHEN "substring"(lower(c_1.rpt_street_name::text), '\s?\m([nsew])[athorsu]*\s??b(oun)?d?'::text) ~* 'w'::text OR "substring"(lower(c_1.rpt_sec_street_name::text), '\s?([nsew])\w*\s?b(oun)?d?'::text) ~* 'w'::text THEN 0
                    WHEN "substring"(lower(c_1.rpt_street_name::text), '\s?\m([nsew])[athorsu]*\s??b(oun)?d?'::text) ~* 'n'::text OR "substring"(lower(c_1.rpt_sec_street_name::text), '\s?([nsew])\w*\s?b(oun)?d?'::text) ~* 'n'::text THEN 90
                    WHEN "substring"(lower(c_1.rpt_street_name::text), '\s?\m([nsew])[athorsu]*\s??b(oun)?d?'::text) ~* 'e'::text OR "substring"(lower(c_1.rpt_sec_street_name::text), '\s?([nsew])\w*\s?b(oun)?d?'::text) ~* 'e'::text THEN 180
                    WHEN "substring"(lower(c_1.rpt_street_name::text), '\s?\m([nsew])[athorsu]*\s??b(oun)?d?'::text) ~* 's'::text OR "substring"(lower(c_1.rpt_sec_street_name::text), '\s?([nsew])\w*\s?b(oun)?d?'::text) ~* 's'::text THEN 270
                    ELSE NULL::integer
                END AS seek_direction
           FROM atd_txdot_crashes c_1
        )
 SELECT
        CASE
            WHEN c.rpt_street_name::text ~* '\s?\m([nsew])[athorsu]*\s??b(oun)?d?'::text OR c.rpt_sec_street_name::text ~* '\s?\m([nsew])[athorsu]*\s??b(oun)?d?'::text THEN true
            ELSE false
        END AS has_directionality,
    d.seek_direction,
    ( SELECT p.location_id
           FROM atd_txdot_locations p
          WHERE
                CASE
                    WHEN
                    CASE
                        WHEN (d.seek_direction - 65) < 0 THEN d.seek_direction - 65 + 360
                        ELSE d.seek_direction - 65
                    END < ((d.seek_direction + 65) % 360) THEN (st_azimuth(c."position", st_centroid(p.shape)) * 180::double precision / pi()) >=
                    CASE
                        WHEN (d.seek_direction - 65) < 0 THEN d.seek_direction - 65 + 360
                        ELSE d.seek_direction - 65
                    END::double precision AND (st_azimuth(c."position", st_centroid(p.shape)) * 180::double precision / pi()) <= ((d.seek_direction + 65) % 360)::double precision
                    ELSE (st_azimuth(c."position", st_centroid(p.shape)) * 180::double precision / pi()) >=
                    CASE
                        WHEN (d.seek_direction - 65) < 0 THEN d.seek_direction - 65 + 360
                        ELSE d.seek_direction - 65
                    END::double precision OR (st_azimuth(c."position", st_centroid(p.shape)) * 180::double precision / pi()) <= ((d.seek_direction + 65) % 360)::double precision
                END AND st_intersects(st_transform(st_buffer(st_transform(c."position", 2277), 750::double precision), 4326), p.shape) AND p.description ~~* '%SVRD%'::text
          ORDER BY (st_distance(st_centroid(p.shape), c."position"))
         LIMIT 1) AS surface_street_polygon,
    st_makeline(st_centroid(( SELECT p.shape
           FROM atd_txdot_locations p
          WHERE
                CASE
                    WHEN
                    CASE
                        WHEN (d.seek_direction - 65) < 0 THEN d.seek_direction - 65 + 360
                        ELSE d.seek_direction - 65
                    END < ((d.seek_direction + 65) % 360) THEN (st_azimuth(c."position", st_centroid(p.shape)) * 180::double precision / pi()) >=
                    CASE
                        WHEN (d.seek_direction - 65) < 0 THEN d.seek_direction - 65 + 360
                        ELSE d.seek_direction - 65
                    END::double precision AND (st_azimuth(c."position", st_centroid(p.shape)) * 180::double precision / pi()) <= ((d.seek_direction + 65) % 360)::double precision
                    ELSE (st_azimuth(c."position", st_centroid(p.shape)) * 180::double precision / pi()) >=
                    CASE
                        WHEN (d.seek_direction - 65) < 0 THEN d.seek_direction - 65 + 360
                        ELSE d.seek_direction - 65
                    END::double precision OR (st_azimuth(c."position", st_centroid(p.shape)) * 180::double precision / pi()) <= ((d.seek_direction + 65) % 360)::double precision
                END AND st_intersects(st_transform(st_buffer(st_transform(c."position", 2277), 750::double precision), 4326), p.shape) AND p.description ~~* '%SVRD%'::text
          ORDER BY (st_distance(st_centroid(p.shape), c."position"))
         LIMIT 1)), c."position") AS proof_line,
    c.crash_id,
    c.crash_date,
    c.crash_time,
    c.rpt_road_part_id,
    c.rpt_rdwy_sys_id,
    c.rpt_hwy_num,
    c.rpt_hwy_sfx,
    c.rpt_block_num,
    c.rpt_street_pfx,
    c.rpt_street_name,
    c.rpt_street_sfx,
    c.rpt_sec_rdwy_sys_id,
    c.rpt_sec_hwy_num,
    c.rpt_sec_hwy_sfx,
    c.rpt_sec_road_part_id,
    c.rpt_sec_block_num,
    c.rpt_sec_street_pfx,
    c.rpt_sec_street_name,
    c.rpt_sec_street_sfx,
    c.rpt_ref_mark_offset_amt,
    c.rpt_ref_mark_dist_uom,
    c.rpt_ref_mark_dir,
    c.rpt_ref_mark_nbr,
    c.rpt_sec_street_desc,
    c.rpt_crossingnumber,
    c.crash_fatal_fl,
    c.cmv_involv_fl,
    c.schl_bus_fl,
    c.rr_relat_fl,
    c.medical_advisory_fl,
    c.amend_supp_fl,
    c.active_school_zone_fl,
    c.case_id,
    c.local_use,
    c.rpt_cris_cnty_id,
    c.rpt_city_id,
    c.rpt_outside_city_limit_fl,
    c.thousand_damage_fl,
    c.rpt_latitude,
    c.rpt_longitude,
    c.private_dr_fl,
    c.toll_road_fl,
    c.crash_speed_limit,
    c.road_constr_zone_fl,
    c.road_constr_zone_wrkr_fl,
    c.rpt_street_desc,
    c.at_intrsct_fl,
    c.wthr_cond_id,
    c.light_cond_id,
    c.entr_road_id,
    c.road_type_id,
    c.road_algn_id,
    c.surf_cond_id,
    c.traffic_cntl_id,
    c.investigat_notify_time,
    c.investigat_notify_meth,
    c.investigat_arrv_time,
    c.report_date,
    c.investigat_comp_fl,
    c.investigator_name,
    c.id_number,
    c.ori_number,
    c.investigat_agency_id,
    c.investigat_area_id,
    c.investigat_district_id,
    c.investigat_region_id,
    c.bridge_detail_id,
    c.harm_evnt_id,
    c.intrsct_relat_id,
    c.fhe_collsn_id,
    c.obj_struck_id,
    c.othr_factr_id,
    c.road_part_adj_id,
    c.road_cls_id,
    c.road_relat_id,
    c.phys_featr_1_id,
    c.phys_featr_2_id,
    c.cnty_id,
    c.city_id,
    c.latitude,
    c.longitude,
    c.hwy_sys,
    c.hwy_nbr,
    c.hwy_sfx,
    c.dfo,
    c.street_name,
    c.street_nbr,
    c.control,
    c.section,
    c.milepoint,
    c.ref_mark_nbr,
    c.ref_mark_displ,
    c.hwy_sys_2,
    c.hwy_nbr_2,
    c.hwy_sfx_2,
    c.street_name_2,
    c.street_nbr_2,
    c.control_2,
    c.section_2,
    c.milepoint_2,
    c.txdot_rptable_fl,
    c.onsys_fl,
    c.rural_fl,
    c.crash_sev_id,
    c.pop_group_id,
    c.located_fl,
    c.day_of_week,
    c.hwy_dsgn_lane_id,
    c.hwy_dsgn_hrt_id,
    c.hp_shldr_left,
    c.hp_shldr_right,
    c.hp_median_width,
    c.base_type_id,
    c.nbr_of_lane,
    c.row_width_usual,
    c.roadbed_width,
    c.surf_width,
    c.surf_type_id,
    c.curb_type_left_id,
    c.curb_type_right_id,
    c.shldr_type_left_id,
    c.shldr_width_left,
    c.shldr_use_left_id,
    c.shldr_type_right_id,
    c.shldr_width_right,
    c.shldr_use_right_id,
    c.median_type_id,
    c.median_width,
    c.rural_urban_type_id,
    c.func_sys_id,
    c.adt_curnt_amt,
    c.adt_curnt_year,
    c.adt_adj_curnt_amt,
    c.pct_single_trk_adt,
    c.pct_combo_trk_adt,
    c.trk_aadt_pct,
    c.curve_type_id,
    c.curve_lngth,
    c.cd_degr,
    c.delta_left_right_id,
    c.dd_degr,
    c.feature_crossed,
    c.structure_number,
    c.i_r_min_vert_clear,
    c.approach_width,
    c.bridge_median_id,
    c.bridge_loading_type_id,
    c.bridge_loading_in_1000_lbs,
    c.bridge_srvc_type_on_id,
    c.bridge_srvc_type_under_id,
    c.culvert_type_id,
    c.roadway_width,
    c.deck_width,
    c.bridge_dir_of_traffic_id,
    c.bridge_rte_struct_func_id,
    c.bridge_ir_struct_func_id,
    c.crossingnumber,
    c.rrco,
    c.poscrossing_id,
    c.wdcode_id,
    c.standstop,
    c.yield,
    c.sus_serious_injry_cnt,
    c.nonincap_injry_cnt,
    c.poss_injry_cnt,
    c.non_injry_cnt,
    c.unkn_injry_cnt,
    c.tot_injry_cnt,
    c.death_cnt,
    c.mpo_id,
    c.investigat_service_id,
    c.investigat_da_id,
    c.investigator_narrative,
    c.geocoded,
    c.geocode_status,
    c.latitude_geocoded,
    c.longitude_geocoded,
    c.latitude_primary,
    c.longitude_primary,
    c.geocode_date,
    c.geocode_provider,
    c.qa_status,
    c.last_update,
    c.approval_date,
    c.approved_by,
    c.is_retired,
    c.updated_by,
    c.address_confirmed_primary,
    c.address_confirmed_secondary,
    c.est_comp_cost,
    c.est_econ_cost,
    c.apd_confirmed_fatality,
    c.apd_confirmed_death_count,
    c.micromobility_device_flag,
    c.cr3_stored_flag,
    c.apd_human_update,
    c.speed_mgmt_points,
    c.geocode_match_quality,
    c.geocode_match_metadata,
    c.atd_mode_category_metadata,
    c.location_id,
    c.changes_approved_date,
    c.austin_full_purpose,
    c.original_city_id,
    c.atd_fatality_count,
    c.temp_record,
    c.cr3_file_metadata,
    c.cr3_ocr_extraction_date,
    c."position"
   FROM atd_txdot_crashes c,
    cr3_mainlanes l,
    seek_direction d
     JOIN atd_jurisdictions aj ON aj.id = 5
  WHERE 1 = 1 AND d.crash_id = c.crash_id AND st_contains(aj.geometry, c."position") AND c.private_dr_fl::text = 'N'::text AND (c.rpt_road_part_id = ANY (ARRAY[2, 3, 4, 5, 7])) AND st_contains(l.geometry, c."position")
WITH DATA;

-- View indexes:
CREATE INDEX mv_cncom_date_idx ON public.cr3_nonproper_crashes_on_mainlane USING btree (crash_date);
CREATE INDEX mv_cncom_geometry_idx ON public.cr3_nonproper_crashes_on_mainlane USING gist ("position");

CREATE MATERIALIZED VIEW public.diagram_aoi_with_labels
TABLESPACE pg_default
AS SELECT da.id,
    da.name,
    da.project,
    da.geometry,
    make_overview_table(da.id) AS overview_table
   FROM diagram_aoi da
WITH DATA;

CREATE MATERIALIZED VIEW public.diagram_intersections_with_labels
TABLESPACE pg_default
AS SELECT di.id,
    di.name,
    di.geometry,
    make_intersection_table(di.id) AS approach_table
   FROM diagram_intersections di
WITH DATA;

CREATE OR REPLACE VIEW public.mainlane_crashes_to_add
AS SELECT cncom.crash_id,
    d.id AS aoi_id,
    concat('https://visionzero.austin.gov/editor/#/crashes/', cncom.crash_id) AS link,
    d.geometry AS aoi_geometry,
    st_convexhull(d.geometry) AS aoi_convexhull,
    cncom."position" AS crash_geometry
   FROM cr3_nonproper_crashes_on_mainlane cncom
     JOIN diagram_aoi d ON (d.id = ANY (ARRAY[14, 13, 7, 15, 17, 16, 20, 36])) AND st_contains(st_convexhull(d.geometry), cncom."position")
  WHERE cncom.crash_date >= '2016-07-01'::date AND cncom.crash_date <= '2021-06-30'::date;
