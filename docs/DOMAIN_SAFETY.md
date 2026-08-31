# Animivo domain safety

## Deterministic systems

The following outputs are produced by versioned code and structured reference data — not by large language models:

- Cat and dog daily energy estimates (RER/MER formulas in `src/lib/diet-calculations.ts`)
- Cat and dog portion calculations
- Bird diet composition guidance (`src/lib/nutrition/bird-reference-data.ts`)
- Mixed-feeding validation
- Diet plan versioning metadata
- Wellness insight severity rules
- Emergency keyword detection

Each calculation records an engine or rule version where persisted.

## What Animivo AI may do

- Explain deterministic plan results in plain language
- Summarize owner-entered records the user is authorized to view
- Provide educational species-appropriate guidance
- Suggest questions for a veterinarian
- Escalate when emergency language is detected

## What Animivo AI may not do

- Diagnose disease
- Invent medication doses
- Override veterinarian instructions
- Generate unsupported numerical feeding plans
- Claim a food product is verified without catalogue status
- Hide uncertainty

## Veterinary escalation

Escalation triggers include emergency symptom language, bird-specific respiratory distress cues, and serious health flags in nutrition inputs. Users see a short urgent-care message — not a conversational diagnosis.

## Reference data versioning

Bird nutrition reference data is versioned (`BIRD_NUTRITION_REFERENCE_VERSION`). Mammal formulas are documented in calculation modules with unit tests.

## Professional review

Therapeutic diets, medical nutrition, breeding/laying birds, and incomplete reference data require explicit avian or general veterinary confirmation in the UI.
