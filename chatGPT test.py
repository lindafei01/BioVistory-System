import os
import openai

openai.api_key = os.getenv("OPENAI_API_KEY")
query = 'Angelina Jolie'

prompt_career_events = 'career events of ' + query
response_career_events = openai.Completion.create(
  model="text-davinci-003",
  prompt=prompt_career_events,
  temperature=0,
  max_tokens=1000,
  n=1
)['choices'][0]['text'].strip()

print(response_career_events)

prompt_relationship_events = 'people related to ' + query
response_retionship_events = openai.Completion.create(
  model="text-davinci-003",
  prompt=prompt_relationship_events,
  temperature=0,
  max_tokens=1000,
  n=1
)['choices'][0]['text'].strip()

print(response_retionship_events)

# prompt_geographic_events = 'where has Steve Jobs been to and what did he do there'
# response_geographic_events = openai.Completion.create(
#   model="text-davinci-003",
#   prompt=prompt_geographic_events,
#   temperature=0,
#   max_tokens=1000,
#   n=1
# )['choices'][0]['text'].strip()

# print(response_geographic_events)

prompt_highlight = "highlights in {}'s life".format(query)
response_highlight = openai.Completion.create(
  model="text-davinci-003",
  prompt=prompt_highlight,
  temperature=0,
  max_tokens=1000,
  n=1
)['choices'][0]['text'].strip()

print(response_highlight)


