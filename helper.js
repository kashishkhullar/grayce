const { DateTime } = require('luxon');


/**
 * Helper function to get the closest timezone to the member timezone from the care partner timezones
 * 
 * @param {string} member_timezone String representing the timezone of the member
 * @param {Object} care_partner_timezones timeszone to ids mapping of the care partners
 */
const getClosestTimezone = (member_timezone, care_partner_timezones) => {
    const now = DateTime.now();
    const member_date_time = now.setZone(member_timezone);

    let closestTimezone = null;
    let closestDiff = Infinity;

    Object.keys(care_partner_timezones).forEach(timezone => {
        const convertedDateTime = now.setZone(timezone);
        const diff = Math.abs(member_date_time.offset - convertedDateTime.offset);

        if (diff < closestDiff) {
            closestDiff = diff;
            closestTimezone = timezone;
        }
    });

    return closestTimezone;
}

/**
 * Helper function to normalize the score
 * 
 * @param {number} score The score to normalize
 * @param {number} minScore The minimum score
 * @param {number} maxScore The maximum score
 */
const normalizeScore = (score, minScore, maxScore) => {
    // Ensure that the maxScore is not equal to minScore to avoid division by zero
    const denominator = maxScore !== minScore ? maxScore - minScore : 1;
    return (score - minScore) / denominator;
}

module.exports = {
    getClosestTimezone,
    normalizeScore
}
