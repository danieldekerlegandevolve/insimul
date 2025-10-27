/**
 * Example Talk of the Town Rules for Insimul
 * Demonstrates integration of TotT conditions and effects
 */

export const tottExampleRules = [
  // ============= EMPLOYMENT RULES =============
  
  {
    name: "succession_planning",
    description: "Family members succeed retiring business owners",
    content: `
      rule succession_planning {
        when (
          age(?owner, ?age) and ?age > 65 and
          owns_business(?owner, ?business) and
          has_child(?owner, ?child) and
          age(?child, ?childAge) and ?childAge > 25 and
          occupation_level(?child, 3)
        )
        then {
          hire(?business, ?child, "Owner", "day")
          retire(?owner)
          add_thought(?child, "Taking over the family business!", "proud")
          add_thought(?owner, "Passing the torch to the next generation", "nostalgic")
        }
        priority: 8
        likelihood: 0.7
      }
    `,
    systemType: "tott",
    ruleType: "action",
    priority: 8,
    likelihood: 0.7,
    tags: ["business", "family", "succession"]
  },
  
  {
    name: "promote_loyal_employee",
    description: "Promote experienced workers to management",
    content: `
      rule promote_loyal_employee {
        when (
          has_occupation(?person, "Worker") and
          years_experience(?person, 5) and
          works_at(?person, ?business) and
          business_has_vacancy(?business, "Manager") and
          personality_trait(?person, "conscientiousness", 0.3)
        )
        then {
          promote(?person)
          add_thought(?person, "Hard work finally paid off!", "excited")
        }
        priority: 6
        likelihood: 0.4
      }
    `,
    systemType: "tott",
    ruleType: "action",
    priority: 6,
    likelihood: 0.4,
    tags: ["career", "promotion", "loyalty"]
  },
  
  {
    name: "unemployment_job_search",
    description: "Unemployed characters look for work",
    content: `
      rule unemployment_job_search {
        when (
          is_unemployed(?person) and
          age(?person, ?age) and ?age >= 18 and ?age <= 65 and
          not(is_retired(?person)) and
          business_has_vacancy(?business, ?occupation)
        )
        then {
          hire(?business, ?person, ?occupation, "day")
          add_thought(?person, "Finally found a job!", "relieved")
        }
        priority: 5
        likelihood: 0.2
      }
    `,
    systemType: "tott",
    ruleType: "action",
    priority: 5,
    likelihood: 0.2,
    tags: ["employment", "job_search"]
  },
  
  // ============= SOCIAL RULES =============
  
  {
    name: "workplace_romance",
    description: "Coworkers may develop romantic relationships",
    content: `
      rule workplace_romance {
        when (
          is_coworker(?person1, ?person2) and
          not(married(?person1)) and
          not(married(?person2)) and
          personalities_compatible(?person1, ?person2) and
          years_known(?person1, ?person2, 2)
        )
        then {
          trigger_marriage(?person1, ?person2)
          add_thought(?person1, "Found love at work", "happy")
          add_thought(?person2, "Found love at work", "happy")
        }
        priority: 4
        likelihood: 0.1
      }
    `,
    systemType: "tott",
    ruleType: "action",
    priority: 4,
    likelihood: 0.1,
    tags: ["romance", "workplace", "marriage"]
  },
  
  {
    name: "neighbor_friendship",
    description: "Neighbors become friends over time",
    content: `
      rule neighbor_friendship {
        when (
          are_neighbors(?person1, ?person2) and
          personality_trait(?person1, "extroversion", 0.2) and
          personality_trait(?person2, "agreeableness", 0.2) and
          not(are_friends(?person1, ?person2))
        )
        then {
          add_relationship(?person1, ?person2, "friend")
          update_belief(?person1, ?person2, {"trustworthy": true, "friendly": true})
          update_belief(?person2, ?person1, {"trustworthy": true, "friendly": true})
        }
        priority: 3
        likelihood: 0.3
      }
    `,
    systemType: "tott",
    ruleType: "action",
    priority: 3,
    likelihood: 0.3,
    tags: ["friendship", "neighbors", "social"]
  },
  
  // ============= BUSINESS RULES =============
  
  {
    name: "entrepreneurial_spirit",
    description: "Ambitious characters start businesses",
    content: `
      rule entrepreneurial_spirit {
        when (
          age(?person, ?age) and ?age >= 25 and ?age <= 45 and
          college_graduate(?person) and
          personality_trait(?person, "openness", 0.5) and
          personality_trait(?person, "conscientiousness", 0.5) and
          property_vacant(?lot) and
          has_savings(?person, 50000)
        )
        then {
          found_business(?person, "New Business", "Generic")
          purchase_property(?person, ?lot)
          add_thought(?person, "Taking the leap into entrepreneurship!", "excited")
        }
        priority: 6
        likelihood: 0.15
      }
    `,
    systemType: "tott",
    ruleType: "action",
    priority: 6,
    likelihood: 0.15,
    tags: ["business", "entrepreneurship", "ambition"]
  },
  
  {
    name: "business_expansion",
    description: "Successful businesses expand",
    content: `
      rule business_expansion {
        when (
          owns_business(?owner, ?business) and
          is_business_type(?business, "ApartmentComplex") and
          business_profitable(?business) and
          years_in_business(?business, 3)
        )
        then {
          expand_apartment_complex(?business)
          create_vacancy(?business, "HotelMaid", "day")
          add_thought(?owner, "Business is booming!", "proud")
        }
        priority: 5
        likelihood: 0.3
      }
    `,
    systemType: "tott",
    ruleType: "action",
    priority: 5,
    likelihood: 0.3,
    tags: ["business", "expansion", "real_estate"]
  },
  
  // ============= LIFE EVENT RULES =============
  
  {
    name: "retirement_decision",
    description: "Older workers decide to retire",
    content: `
      rule retirement_decision {
        when (
          age(?person, ?age) and ?age >= 65 and
          has_occupation(?person, ?occupation) and
          not(owns_business(?person)) and
          years_experience(?person, 20)
        )
        then {
          retire(?person)
          add_thought(?person, "Time to enjoy retirement", "content")
        }
        priority: 7
        likelihood: 0.5
      }
    `,
    systemType: "tott",
    ruleType: "action",
    priority: 7,
    likelihood: 0.5,
    tags: ["retirement", "life_event", "aging"]
  },
  
  {
    name: "starting_family",
    description: "Married couples have children",
    content: `
      rule starting_family {
        when (
          married(?person1, ?person2) and
          age(?person1, ?age1) and ?age1 >= 25 and ?age1 <= 35 and
          age(?person2, ?age2) and ?age2 >= 25 and ?age2 <= 35 and
          owns_property(?person1) and
          num_children(?person1, ?count) and ?count < 3
        )
        then {
          trigger_birth(?person1, ?person2)
          add_thought(?person1, "We're having a baby!", "excited")
          add_thought(?person2, "We're having a baby!", "excited")
        }
        priority: 6
        likelihood: 0.3
      }
    `,
    systemType: "tott",
    ruleType: "action",
    priority: 6,
    likelihood: 0.3,
    tags: ["family", "birth", "life_event"]
  },
  
  {
    name: "empty_nest_downsize",
    description: "Empty nesters move to smaller homes",
    content: `
      rule empty_nest_downsize {
        when (
          age(?person, ?age) and ?age > 55 and
          owns_property(?person) and
          lives_at(?person, ?largeHome) and
          all_children_moved_out(?person) and
          property_available(?smallerHome) and
          smaller_than(?smallerHome, ?largeHome)
        )
        then {
          purchase_home(?person, ?smallerHome)
          move_to(?person, ?smallerHome)
          add_thought(?person, "Time to downsize", "nostalgic")
        }
        priority: 4
        likelihood: 0.2
      }
    `,
    systemType: "tott",
    ruleType: "action",
    priority: 4,
    likelihood: 0.2,
    tags: ["real_estate", "aging", "downsizing"]
  },
  
  // ============= PERSONALITY-DRIVEN RULES =============
  
  {
    name: "extrovert_socializing",
    description: "Extroverts organize social events",
    content: `
      rule extrovert_socializing {
        when (
          personality_trait(?person, "extroversion", 0.6) and
          at_home(?person) and
          time_of_day("evening") and
          has_friends(?person)
        )
        then {
          organize_gathering(?person)
          invite_friends(?person)
          add_thought(?person, "Love having people over!", "happy")
        }
        priority: 3
        likelihood: 0.4
      }
    `,
    systemType: "tott",
    ruleType: "action",
    priority: 3,
    likelihood: 0.4,
    tags: ["social", "personality", "events"]
  },
  
  {
    name: "conscientious_work_ethic",
    description: "Conscientious workers take on extra responsibilities",
    content: `
      rule conscientious_work_ethic {
        when (
          personality_trait(?person, "conscientiousness", 0.7) and
          at_work(?person) and
          works_at(?person, ?business) and
          business_has_vacancy(?business, ?supplemental)
        )
        then {
          take_supplemental_job(?person, ?business, ?supplemental)
          add_thought(?person, "I can handle the extra responsibility", "determined")
        }
        priority: 4
        likelihood: 0.3
      }
    `,
    systemType: "tott",
    ruleType: "action",
    priority: 4,
    likelihood: 0.3,
    tags: ["work", "personality", "ambition"]
  },
  
  // ============= MEMORY & COGNITION RULES =============
  
  {
    name: "remembering_old_friends",
    description: "Characters reconnect with old friends",
    content: `
      rule remembering_old_friends {
        when (
          remembers(?person1, ?person2) and
          not(is_coworker(?person1, ?person2)) and
          not(are_neighbors(?person1, ?person2)) and
          years_since_interaction(?person1, ?person2, 5) and
          has_thought_about(?person1, ?person2)
        )
        then {
          reconnect(?person1, ?person2)
          update_belief(?person1, ?person2, {"nostalgic": true})
          add_thought(?person1, "Should catch up with old friends", "nostalgic")
        }
        priority: 2
        likelihood: 0.1
      }
    `,
    systemType: "tott",
    ruleType: "action",
    priority: 2,
    likelihood: 0.1,
    tags: ["memory", "friendship", "reconnection"]
  },
  
  // ============= ECONOMIC RULES =============
  
  {
    name: "economic_hardship_closure",
    description: "Struggling businesses close",
    content: `
      rule economic_hardship_closure {
        when (
          owns_business(?owner, ?business) and
          business_losing_money(?business) and
          years_losing(?business, 2) and
          not(can_afford_losses(?owner))
        )
        then {
          close_business(?business, "economic_hardship")
          add_thought(?owner, "Had to close the business...", "sad")
        }
        priority: 7
        likelihood: 0.6
      }
    `,
    systemType: "tott",
    ruleType: "action",
    priority: 7,
    likelihood: 0.6,
    tags: ["business", "economy", "closure"]
  },
  
  // ============= SPECIAL OCCUPATION RULES =============
  
  {
    name: "doctor_delivers_baby",
    description: "Doctors deliver babies for pregnant women",
    content: `
      rule doctor_delivers_baby {
        when (
          has_occupation(?doctor, "Doctor") and
          at_work(?doctor) and
          pregnant(?mother) and
          due_date(?mother)
        )
        then {
          doctor_deliver_baby(?doctor, ?mother)
          add_thought(?doctor, "Delivered another baby today", "satisfied")
          add_thought(?mother, "My baby is here!", "joyful")
        }
        priority: 9
        likelihood: 1.0
      }
    `,
    systemType: "tott",
    ruleType: "action",
    priority: 9,
    likelihood: 1.0,
    tags: ["medical", "birth", "profession"]
  },
  
  {
    name: "lawyer_handles_divorce",
    description: "Lawyers handle divorce proceedings",
    content: `
      rule lawyer_handles_divorce {
        when (
          has_occupation(?lawyer, "Lawyer") and
          at_work(?lawyer) and
          want_divorce(?person1, ?person2) and
          married(?person1, ?person2)
        )
        then {
          lawyer_file_divorce(?lawyer, ?person1, ?person2)
          add_thought(?lawyer, "Another divorce case", "professional")
        }
        priority: 8
        likelihood: 1.0
      }
    `,
    systemType: "tott",
    ruleType: "action",
    priority: 8,
    likelihood: 1.0,
    tags: ["legal", "divorce", "profession"]
  }
];
