-- Insert standard D&D 5e feats
-- This populates the standard_feats table with common feats

INSERT INTO public.standard_feats (name, description, prerequisites, benefits) VALUES
('Alert', 'Always on the lookout for danger, you gain a bonus  to initiative and can''t be surprised.', null, ARRAY[
  '+5 bonus to initiative',
  'You can''t be surprised while conscious',
  'Other creatures don''t gain advantage on attack rolls against you as a result of being unseen by you'
]),

('Athlete', 'You have undergone extensive physical training.', null, ARRAY[
  'Increase your Strength or Dexterity by 1, to a maximum of 20',
  'When you are prone, standing up uses only 5 feet of your movement',
  'Climbing doesn''t cost you extra movement',
  'You can make a running long jump or a running high jump after moving only 5 feet on foot'
]),

('Actor', 'Skilled at mimicry and dramatics.', null, ARRAY[
  'Increase your Charisma by 1, to a maximum of 20',
  'You have advantage on Charisma (Deception) and Charisma (Performance) checks when trying to pass yourself off as a different person',
  'You can mimic the speech of another person or the sounds made by other creatures'
]),

('Charger', 'When you use your action to Dash, you can use a bonus action to make an attack or shove.', null, ARRAY[
  'When you use your action to Dash, you can use a bonus action to make one melee weapon attack or to shove a creature',
  'If you move at least 10 feet in a straight line before making this attack, you either gain a +5 bonus to the attack''s damage roll or push the target up to 10 feet away'
]),

('Crossbow Expert', 'Thanks to extensive practice with crossbows, you gain several benefits.', null, ARRAY[
  'You ignore the loading quality of crossbows with which you are proficient',
  'Being within 5 feet of a hostile creature doesn''t impose disadvantage on your ranged attack rolls',
  'When you use the Attack action and attack with a one-handed weapon, you can use a bonus action to attack with a hand crossbow you are holding'
]),

('Defensive Duelist', 'When wielding a finesse weapon, you can use your reaction to add your proficiency bonus to your AC.', 'Dexterity 13 or higher', ARRAY[
  'When you are wielding a finesse weapon with which you are proficient and another creature hits you with a melee attack, you can use your reaction to add your proficiency bonus to your AC for that attack, potentially causing the attack to miss you'
]),

('Dual Wielder', 'You master fighting with two weapons.', null, ARRAY[
  'You gain a +1 bonus to AC while you are wielding a separate melee weapon in each hand',
  'You can use two-weapon fighting even when the one-handed melee weapons you are wielding aren''t light',
  'You can draw or stow two one-handed weapons when you would normally be able to draw or stow only one'
]),

('Dungeon Delver', 'Alert to the hidden traps and secret doors found in many dungeons.', null, ARRAY[
  'You have advantage on Wisdom (Perception) and Intelligence (Investigation) checks made to detect the presence of secret doors',
  'You have advantage on saving throws made to avoid or resist traps',
  'You have resistance to the damage dealt by traps',
  'Traveling at a fast pace doesn''t impose the normal -5 penalty on your passive Wisdom (Perception) score'
]),

('Durable', 'Hardy and resilient, you gain extra hit points.', null, ARRAY[
  'Increase your Constitution by 1, to a maximum of 20',
  'When you roll Hit Dice to regain hit points, the minimum number of hit points you regain from the roll equals twice your Constitution modifier (minimum of 2)'
]),

('Elemental Adept', 'When you gain this feat, choose one damage type: acid, cold, fire, lightning, or thunder.', 'The ability to cast at least one spell', ARRAY[
  'Spells you cast ignore resistance to damage of the chosen type',
  'When you roll damage for a spell you cast that deals damage of that type, you can treat any 1 on a damage die as a 2'
]),

('Grappler', 'You''ve developed skills necessary to hold your own in close-quarters grappling.', 'Strength 13 or higher', ARRAY[
  'You have advantage on attack rolls against a creature you are grappling',
  'You can use your action to try to pin a creature grappled by you. To do so, make another grapple check. If you succeed, you and the creature are both restrained until the grapple ends'
]),

('Great Weapon Master', 'You''ve learned to put the weight of a weapon to your advantage.', null, ARRAY[
  'On your turn, when you score a critical hit with a melee weapon or reduce a creature to 0 hit points with one, you can make one melee weapon attack as a bonus action',
  'Before you make a melee attack with a heavy weapon that you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack''s damage'
]),

('Healer', 'You are an able physician, allowing you to mend wounds quickly.', null, ARRAY[
  'When you use a healer''s kit to stabilize a dying creature, that creature also regains 1 hit point',
  'As an action, you can spend one use of a healer''s kit to tend to a creature and restore 1d6 + 4 hit points to it, plus additional hit points equal to the creature''s maximum number of Hit Dice'
]),

('Heavily Armored', 'You have trained to master the use of heavy armor.', 'Proficiency with medium armor', ARRAY[
  'Increase your Strength by 1, to a maximum of 20',
  'You gain proficiency with heavy armor'
]),

('Heavy Armor Master', 'You can use your armor to deflect strikes that would kill others.', 'Proficiency with heavy armor', ARRAY[
  'Increase your Strength by 1, to a maximum of 20',
  'While you are wearing heavy armor, bludgeoning, piercing, and slashing damage that you take from nonmagical weapons is reduced by 3'
]),

('Inspiring Leader', 'You can spend 10 minutes inspiring your companions.', 'Charisma 13 or higher', ARRAY[
  'You can spend 10 minutes inspiring your companions, shoring up their resolve to fight',
  'Choose up to six friendly creatures (which can include yourself) within 30 feet who can see or hear you. Each creature can gain temporary hit points equal to your level + your Charisma modifier'
]),

('Keen Mind', 'You have a mind that can track time, direction, and detail with uncanny precision.', null, ARRAY[
  'Increase your Intelligence by 1, to a maximum of 20',
  'You always know which way is north',
  'You always know the number of hours left before the next sunrise or sunset',
  'You can accurately recall anything you have seen or heard within the past month'
]),

('Lightly Armored', 'You have trained to master the use of light armor.', null, ARRAY[
  'Increase your Strength or Dexterity by 1, to a maximum of 20',
  'You gain proficiency with light armor'
]),

('Lucky', 'You have inexplicable luck that seems to kick in at just the right moment.', null, ARRAY[
  'You have 3 luck points. Whenever you make an attack roll, ability check, or saving throw, you can spend one luck point to roll an additional d20',
  'You can also spend one luck point when an attack roll is made against you. Roll a d20, and then choose whether the attack uses the attacker''s roll or yours',
  'You regain your expended luck points when you finish a long rest'
]),

('Mage Slayer', 'You have practiced techniques in melee combat against spellcasters.', null, ARRAY[
  'When a creature within 5 feet of you casts a spell, you can use your reaction to make a melee weapon attack against that creature',
  'When you damage a creature that is concentrating on a spell, that creature has disadvantage on the saving throw it makes to maintain its concentration',
  'You have advantage on saving throws against spells cast by creatures within 5 feet of you'
]),

('Magic Initiate', 'Choose a class: bard, cleric, druid, sorcerer, warlock, or wizard. You learn two cantrips and one 1st-level spell.', null, ARRAY[
  'You learn two cantrips of your choice from that class''s spell list',
  'You learn one 1st-level spell of your choice from that class''s spell list',
  'You can cast this spell once without expending a spell slot. You must finish a long rest before you can cast it in this way again'
]),

('Martial Adept', 'You have martial training that allows you to perform special combat maneuvers.', null, ARRAY[
  'You learn two maneuvers of your choice from among those available to the Battle Master archetype',
  'If a maneuver you use requires your target to make a saving throw, the DC equals 8 + your proficiency bonus + your Strength or Dexterity modifier',
  'You gain one superiority die, which is a d6. This die is used to fuel your maneuvers'
]),

('Medium Armor Master', 'You have practiced moving in medium armor.', 'Proficiency with medium armor', ARRAY[
  'Wearing medium armor doesn''t impose disadvantage on your Dexterity (Stealth) checks',
  'When you wear medium armor, you can add 3, rather than 2, to your AC if you have a Dexterity of 16 or higher'
]),

('Mobile', 'You are exceptionally speedy and agile.', null, ARRAY[
  'Your speed increases by 10 feet',
  'When you use the Dash action, difficult terrain doesn''t cost you extra movement on that turn',
  'When you make a melee attack against a creature, you don''t provoke opportunity attacks from that creature for the rest of the turn'
]),

('Mounted Combatant', 'You are a dangerous foe to face while mounted.', null, ARRAY[
  'You have advantage on melee attack rolls against any unmounted creature that is smaller than your mount',
  'You can force an attack targeted at your mount to target you instead',
  'If your mount is subjected to an effect that allows it to make a Dexterity saving throw to take only half damage, it instead takes no damage if it succeeds, and only half damage if it fails'
]),

('Observant', 'Quick to notice details of your environment.', null, ARRAY[
  'Increase your Intelligence or Wisdom by 1, to a maximum of 20',
  'If you can see a creature''s mouth while it is speaking a language you understand, you can interpret what it''s saying by reading its lips',
  'You have a +5 bonus to your passive Wisdom (Perception) and passive Intelligence (Investigation) scores'
]),

('Polearm Master', 'You gain the following benefits while wielding a glaive, halberd, pike, quarterstaff, or spear.', null, ARRAY[
  'When you take the Attack action and attack with only a glaive, halberd, quarterstaff, or spear, you can use a bonus action to make a melee attack with the opposite end of the weapon',
  'While you are wielding a glaive, halberd, pike, quarterstaff, or spear, other creatures provoke an opportunity attack from you when they enter your reach'
]),

('Resilient', 'Choose one ability score. You gain proficiency in saving throws using the chosen ability.', null, ARRAY[
  'Increase the chosen ability score by 1, to a maximum of 20',
  'You gain proficiency in saving throws using the chosen ability'
]),

('Ritual Caster', 'You have learned a number of spells that you can cast as rituals.', 'Intelligence or Wisdom 13 or higher', ARRAY[
  'Choose a class (bard, cleric, druid, sorcerer, warlock, or wizard). You acquire a ritual book holding two 1st-level spells with the ritual tag from that class''s spell list',
  'You can cast these spells as rituals. The spells must be of a level you can cast',
  'On your adventures, you can add other ritual spells to your book'
]),

('Savage Attacker', 'Once per turn when you roll damage for a melee weapon attack, you can reroll the weapon''s damage dice and use either total.', null, ARRAY[
  'Once per turn when you roll damage for a melee weapon attack, you can reroll the weapon''s damage dice and use either total'
]),

('Sentinel', 'You have mastered techniques to take advantage of every drop in any enemy''s guard.', null, ARRAY[
  'When you hit a creature with an opportunity attack, the creature''s speed becomes 0 for the rest of the turn',
  'Creatures provoke opportunity attacks from you even if they take the Disengage action before leaving your reach',
  'When a creature within 5 feet of you makes an attack against a target other than you, you can use your reaction to make a melee weapon attack against the attacking creature'
]),

('Sharpshooter', 'You have mastered ranged weapons and can make shots that others find impossible.', null, ARRAY[
  'Attacking at long range doesn''t impose disadvantage on your ranged weapon attack rolls',
  'Your ranged weapon attacks ignore half cover and three-quarters cover',
  'Before you make an attack with a ranged weapon that you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack''s damage'
]),

('Shield Master', 'You use shields not just for protection but also for offense.', null, ARRAY[
  'If you take the Attack action on your turn, you can use a bonus action to try to shove a creature within 5 feet of you with your shield',
  'If you aren''t incapacitated, you can add your shield''s AC bonus to any Dexterity saving throw you make against a spell or other harmful effect that targets only you',
  'If you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you can use your reaction to take no damage if you succeed on the saving throw'
]),

('Skilled', 'You gain proficiency in any combination of three skills or tools of your choice.', null, ARRAY[
  'You gain proficiency in any combination of three skills or tools of your choice'
]),

('Skulker', 'You are expert at slinking through shadows.', 'Dexterity 13 or higher', ARRAY[
  'You can try to hide when you are lightly obscured from the creature from which you are hiding',
  'When you are hidden from a creature and miss it with a ranged weapon attack, making the attack doesn''t reveal your position',
  'Dim light doesn''t impose disadvantage on your Wisdom (Perception) checks relying on sight'
]),

('Spell Sniper', 'You have learned techniques to enhance your attacks with certain kinds of spells.', 'The ability to cast at least one spell', ARRAY[
  'When you cast a spell that requires you to make an attack roll, the spell''s range is doubled',
  'Your ranged spell attacks ignore half cover and three-quarters cover',
  'You learn one cantrip that requires an attack roll from the class spell list. Your spellcasting ability for this cantrip is the same as the class you chose it from'
]),

('Tavern Brawler', 'Accustomed to rough-and-tumble fighting using whatever weapons happen to be at hand.', null, ARRAY[
  'Increase your Strength or Constitution by 1, to a maximum of 20',
  'You are proficient with improvised weapons',
  'Your unarmed strike uses a d4 for damage',
  'When you hit a creature with an unarmed strike or an improvised weapon on your turn, you can use a bonus action to attempt to grapple the target'
]),

('Tough', 'Your hit point maximum increases by an amount equal to twice your level when you gain this feat.', null, ARRAY[
  'Your hit point maximum increases by an amount equal to twice your level when you gain this feat',
  'Whenever you gain a level thereafter, your hit point maximum increases by an additional 2 hit points'
]),

('War Caster', 'You have practiced casting spells in the midst of combat.', 'The ability to cast at least one spell', ARRAY[
  'You have advantage on Constitution saving throws that you make to maintain your concentration on a spell when you take damage',
  'You can perform the somatic components of spells even when you have weapons or a shield in one or both hands',
  'When a hostile creature''s movement provokes an opportunity attack from you, you can use your reaction to cast a spell at the creature, rather than making an opportunity attack'
]),

('Weapon Master', 'You have practiced extensively with a variety of weapons.', null, ARRAY[
  'Increase your Strength or Dexterity by 1, to a maximum of 20',
  'You gain proficiency with four weapons of your choice. Each one must be a simple or a martial weapon'
])

ON CONFLICT DO NOTHING;
