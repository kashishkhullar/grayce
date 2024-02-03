const fs = require('fs');
const { getClosestTimezone, normalizeScore } = require('./helper');
const { WEIGHTS } = require('./constants');

// Read the members and care partners data from the files
let members, care_partners;
try {
    const members_data = fs.readFileSync('members.json', 'utf8');
    const care_partners_data = fs.readFileSync('care_partners.json', 'utf8');
    members = JSON.parse(members_data);
    care_partners = JSON.parse(care_partners_data);
} catch (err) {
    console.error('Error reading the file:', err);
}

// Sort members by acuity complex to simple
const sort_order = { 'complex': 1, 'simple': 2, 'just_browsing': 3 };
members.sort((a, b) => {
    return sort_order[a.acuity] - sort_order[b.acuity];
});


// Global variables to store the care partner ids, cases and assigned members
const care_partner_mapping = {};
const care_partner_cases = {};
const assigned_members = [];

// Iterate through the care partners and create a mapping of care partners by specialty and timezone
care_partners.forEach(care_partner => {

    if (care_partner.specialties.length !== 0) {
        care_partner.specialties.forEach(specialty => {
            care_partner_mapping[specialty] = care_partner_mapping[specialty] || {};
            care_partner_mapping[specialty][care_partner.timezone] = care_partner_mapping[specialty][care_partner.timezone] || [];
            care_partner_mapping[specialty][care_partner.timezone].push(care_partner.id);
        });
    } else {
        care_partner_mapping['general'] = care_partner_mapping['general'] || {};
        care_partner_mapping['general'][care_partner.timezone] = care_partner_mapping['general'][care_partner.timezone] || [];
        care_partner_mapping['general'][care_partner.timezone].push(care_partner.id);
    }

    // Initialize the care partner cases
    care_partner_cases[care_partner.id] = {
        current_active_cases: care_partner.current_active_cases,
        current_cases: care_partner.current_cases,
    };
});

// Iterate through the members (sorted), take their use_case and find closest timezone for them (use care recipient location) we are prioritizing care partner to be closer to the care recipient than care giver.
members.forEach(member => {
    let use_case = member.use_case;
    let member_timezone = member.care_recipient_location.timezone;
    let care_partner_timezones = null;

    // get timezones for care partners based on use case
    if (member.acuity === 'just_browsing')
        care_partner_timezones = care_partner_mapping['general'];
    else
        care_partner_timezones = care_partner_mapping[use_case] || care_partner_mapping['general'];


    // get closest timezone to member timezone
    const closest_timezone = getClosestTimezone(member_timezone, care_partner_timezones);

    let min_score = Infinity;
    let max_score = -Infinity;
    let best_care_partner = null;
    let best_score = -Infinity;

    // Find current max and current min scores
    // Can be optimized by storing these values in the care_partner_cases object and updating them as we go through the members,
    // but for the sake of simplicity, we are recalculating them for each member.
    care_partner_timezones[closest_timezone].forEach(carePartner => {
        const score = WEIGHTS.ACTIVE_CASES * care_partner_cases[carePartner].current_active_cases
            + WEIGHTS.INACTIVE_CASES * (care_partner_cases[carePartner].current_cases - care_partner_cases[carePartner].current_active_cases);

        if (score < min_score) {
            min_score = score;
        }

        if (score > max_score) {
            max_score = score;
        }
    });

    // Find the best care partner for the member
    care_partner_timezones[closest_timezone].forEach(carePartner => {
        const score = WEIGHTS.ACTIVE_CASES * care_partner_cases[carePartner].current_active_cases
            + WEIGHTS.INACTIVE_CASES * (care_partner_cases[carePartner].current_cases - care_partner_cases[carePartner].current_active_cases);

        const normalizedScore = normalizeScore(score, min_score, max_score);

        if (normalizedScore > best_score) {
            best_score = normalizedScore;
            best_care_partner = carePartner;
        }
    });

    care_partner_cases[best_care_partner].current_active_cases++;
    care_partner_cases[best_care_partner].current_cases++;

    assigned_members.push({ member_id: member.id, care_partner_id: best_care_partner });

});

// As per problem description, we need the members in order, therefore sorting the assigned members by member_id
assigned_members.sort((a, b) => a.member_id - b.member_id);

const jsonString = JSON.stringify(assigned_members, null, 2);
const filePath = 'output.json';

try {
    fs.writeFileSync(filePath, jsonString);
} catch (err) {
    console.error('Error writing to file:', err);
}