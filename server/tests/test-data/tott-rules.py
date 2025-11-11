# Talk of the Town style rules for testing

class FriendlyGreeting:
    """A friendly greeting between characters with good relationship."""
    
    name = "Friendly Greeting"
    rule_type = "social"
    priority = 5
    
    @staticmethod
    def preconditions(character, target):
        """Check if conditions are met for this rule."""
        return (
            character.mood == "happy" and
            character.get_relationship(target) > 0.5
        )
    
    @staticmethod
    def effects(character, target):
        """Apply the effects of this rule."""
        character.say("Hello, friend!")
        character.modify_relationship(target, 0.1)


class AngryConfrontation:
    """An angry confrontation between characters with poor relationship."""
    
    name = "Angry Confrontation"
    rule_type = "social"
    priority = 7
    
    @staticmethod
    def preconditions(character, target):
        """Check if conditions are met for this rule."""
        return (
            character.mood == "angry" and
            character.get_relationship(target) < -0.3
        )
    
    @staticmethod
    def effects(character, target):
        """Apply the effects of this rule."""
        character.say("I have a problem with you!")
        character.modify_relationship(target, -0.2)
