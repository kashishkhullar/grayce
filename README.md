# Grayce Take Home Exercise 👋

This is a take home exercise for Grayce. The goal of this exercise is to assign members to care partners based on characteristics of the members and care partners. We read the data from a json file and then assign members to care partners based on the following criteria:

1. We prioritize members based on their acuity. We assign members with higher acuity (complex) first and lower acuity (just_browsing) last.
2. We match the member to the care partner based on the member's use_case and the care partner's specialties.

> In case there are no specialties provided by the care partner, we use them to match with "just_browsing" acuity members.

3. We take into account the timezone of the care recipient and the care partner. We prioritize care partners that are closer to the care recipient than the care giver. (This is a personal preference, we can change this to prioritize care partners that are closer to the care giver than the care recipient or find a middle ground. However more data is required to make a decision)

4. Each member is assigned to a care partner based on the use_case, closest timezone (In case they need to communicate effectively) and the calculated score of the care partner. The score of the care partner is based on the current work load of the care partner.

## Assumptions

Following are the assumptions made for this exercise:

1. Location of the care recipient and care giver is provided in the data. However has no affect on the assignment of the member to the care partner.
2. We are assuming "just_browsing" acuity members to be of least priority.
3. We are assuming there is no capacity limit for the care partners.
4. We are assuming that the care partners are available to take on new cases.
5. We are assuming that the care partners with more active cases have more work load.

## Data

### Member

```json
{
    "id": 1,
    "acuity": "simple",
    "use_case": "infant",
    "first_name": "Christine",
    "last_name": "Carter",
    "care_recipient_location": {
        "country_code": "US",
        "lat": "36.8638097",
        "lng": "-76.05593929999999",
        "locality": "Virginia Beach",
        "postal_code": "23454",
        "state": "Virginia",
        "timezone": "America/New_York"
    },
    "caregiver_location": {
        "country_code": "US",
        "lat": "41.6417186",
        "lng": "-84.02019159999999",
        "locality": "Delta",
        "postal_code": "43515",
        "state": "Ohio",
        "timezone": "America/New_York"
    }
}
```

### Care Partner

```json
  {
    "id": 1,
    "current_active_cases": 23,
    "current_cases": 516,
    "first_name": "Roseanna",
    "last_name": "Betsy",
    "specialties": [
      "pregnancy",
      "self"
    ],
    "timezone": "America/Los_Angeles"
  },
```

## Steps to run

1. Clone the repository
2. Run `npm install`
3. Run `npm start`

## Design Choices in Code

1. Members are sorted based on acuity which allows us to prioritize members based on their acuity. We can then assign members with higher acuity first and then lower acuity last.

    ```js
    members.sort((a, b) => {
        return sort_order[a.acuity] - sort_order[b.acuity];
    });
    ```

2. We have created three structures in the code:

    1. `care_partner_mapping` - Maps use_case to timezone to care partner ids
    2. `care_partner_cases` - Maps care partner ids to their current active cases and current cases
    3. `assigned_members` - List of members that have been assigned to a care partner

3. We iterated through the care partners and store them in the `care_partner_mapping` and `care_partner_cases` objects.

```js
care_partner_mapping[specialty][care_partner.timezone].push(care_partner.id);
```

> In case there are no specialties provided by the care partner, we store them in the `general` specialty.

```js
care_partner_mapping["general"][care_partner.timezone].push(care_partner.id);
```

4. We iterated through the members, take their `use_case` and find closest timezone for them (using care recipient location)

> For comparing timezones `luxon` module is used to calculate the difference between the timezones.

5. We calculate the score of the care partner based on the current work load of the care partner. We use the `current_active_cases` and inactive cases (`current_cases` - `current_active_cases`) and multiply them to constant weights to calculate the score of the care partner.

```js
const score =
    WEIGHTS.ACTIVE_CASES * care_partner_cases[carePartner].current_active_cases +
    WEIGHTS.INACTIVE_CASES *
        (care_partner_cases[carePartner].current_cases - care_partner_cases[carePartner].current_active_cases);
```

> These weights can be adjusted based on the business requirements.
> A higher score is assigned when the inactive cases are more than the active cases. Therefore a weight of `0.9` is assigned to the inactive cases and `0.1` to the active cases.
> Weights are normalized to `1` using min-max normalization.

6. We then assign the member to the best calculated care partner.

## Improvements

1. Language data would be more helpful in assigning members to care partners. For example, if the care recipient speaks Spanish, we can assign them to a care partner that speaks Spanish.
2. A heap data structure could be utilized to store the care partners and its cases to improve the time complexity of the code. (However, the care partner will be shared among multiple heaps based on the use_case and timezone of the care recipient if the same storage structure is followed).
3. Given there are `N members`, `M care partners`, `P specialties`, the time complexity of the code is `O(NlogN + M*P + N*M)``.
4. In real world scenario, where we will have large number of members, we won't be sorting the values and members are joining the system in real time, we need a priority to which will sort the members based on their acuity and then assign the top.
5. Instead of using the scores, each timezone can be assigned a min heap with care partner id and their cases. This will allow us to assign the member to the care partner with the least cases in the same timezone first and the heapify operation will take `O(logM)` time.
6. We should put a max capacity to all the care partners and then assign the members to the care partners based on their capacity and make the load balancer such that it removes the care partner from the heap if the capacity is full.

---

Thanks,

**Kashish 🚀**
