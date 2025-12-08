-- Add GHW attribute to courses that should have it but are missing
-- This script carefully preserves existing attributes and adds GHW

-- Non-KINES GHW courses
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'AA 130N' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'AA 230N' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'ASIA 106N' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'BBH 101' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'BBH 101H' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'BBH 102S' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'BBH 119' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'BBH 130' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'BBH 143' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'BBH 146' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'BBH 150N' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'BBH 452' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'BBH 458' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'BIOL 160N' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'CI 105N' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'CMAS 258N' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'CRIMJ 150N' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'CSD 100' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'CSD 111' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'DANCE 170' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'DANCE 270' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'DANCE 405' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'FDSC 105' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'HDFS 101N' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'HDFS 108N' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'HDFS 109' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'HDFS 210' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'HDFS 215N' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'HDFS 258N' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'HHUM 112' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'HM 208' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'HM 209' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'HPA 57' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'NURS 203' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'NURS 407' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'NURS 452' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'NURS 464' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'NUTR 100' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'NUTR 144' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'NUTR 175N' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'NUTR 310N' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'RHS 226' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'RPTM 1' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'RPTM 89' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'RPTM 140' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'RPTM 280' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'RPTM 305' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'SOC 150N' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'SOC 210N' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'SOC 258N' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'STS 105' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'VBSC 130' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'WFED 119' AND gen_ed_json = '[]';

-- HHUM 111N already has GH, add GHW
UPDATE courses SET gen_ed_json = '["GH","GHW"]' WHERE id = 'HHUM 111N' AND gen_ed_json = '["GH"]';

-- KINES courses (all GHW)
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 1' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 4' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 6' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 10' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 10A' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 11' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 12' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 13' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 17' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 20' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 24' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 25' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 27' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 29' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 29B' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 29C' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 42' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 44' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 45' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 46' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 47A' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 47B' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 48' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 50' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 54N' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 56' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 57' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 61' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 61S' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 62' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 63' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 65' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 67' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 68' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 70' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 72' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 76' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 77' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 77A' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 81' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 82' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 83' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 84' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 85N' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 88' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 89' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 90' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 90A' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 90B' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 91A' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 91D' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 92' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 93' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 160N' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 222N' AND gen_ed_json = '[]';
UPDATE courses SET gen_ed_json = '["GHW"]' WHERE id = 'KINES 303' AND gen_ed_json = '[]';

-- Update raw_json attributes as well for consistency
UPDATE courses SET raw_json = json_set(raw_json, '$.attributes.gen_ed', json('["GHW"]')) 
WHERE id IN ('AA 130N', 'AA 230N', 'ASIA 106N', 'BBH 101', 'BBH 101H', 'BBH 102S', 'BBH 119', 'BBH 130', 'BBH 143', 'BBH 146', 'BBH 150N', 'BBH 452', 'BBH 458', 'BIOL 160N', 'CI 105N', 'CMAS 258N', 'CRIMJ 150N', 'CSD 100', 'CSD 111', 'DANCE 170', 'DANCE 270', 'DANCE 405', 'FDSC 105', 'HDFS 101N', 'HDFS 108N', 'HDFS 109', 'HDFS 210', 'HDFS 215N', 'HDFS 258N', 'HHUM 112', 'HM 208', 'HM 209', 'HPA 57', 'NURS 203', 'NURS 407', 'NURS 452', 'NURS 464', 'NUTR 100', 'NUTR 144', 'NUTR 175N', 'NUTR 310N', 'RHS 226', 'RPTM 1', 'RPTM 89', 'RPTM 140', 'RPTM 280', 'RPTM 305', 'SOC 150N', 'SOC 210N', 'SOC 258N', 'STS 105', 'VBSC 130', 'WFED 119')
AND gen_ed_json = '["GHW"]';

UPDATE courses SET raw_json = json_set(raw_json, '$.attributes.gen_ed', json('["GHW"]')) 
WHERE id LIKE 'KINES%' AND gen_ed_json = '["GHW"]';
