import random
import time

PROVIDERS = [
    {"name": "openai", "role": "strategy"},
    {"name": "anthropic", "role": "synthesis"},
    {"name": "perplexity", "role": "research"},
    {"name": "xai", "role": "validation"}
]

class BudgetExceeded(Exception):
    pass

class ProviderError(Exception):
    pass


def estimate_cost(tokens_in, tokens_out, rate=0.00001):
    return (tokens_in + tokens_out) * rate


def call_provider(provider, task, context):
    # placeholder for real API call
    if random.random() < 0.15:
        raise ProviderError(f"{provider['name']} failed")
    tokens_in = random.randint(100, 500)
    tokens_out = random.randint(200, 800)
    return {
        "provider": provider["name"],
        "output": f"processed by {provider['name']}",
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
        "cost": estimate_cost(tokens_in, tokens_out)
    }


def reorder_agents(history):
    # simple adaptive reorder: move failing providers to end
    success_scores = {}
    for h in history:
        success_scores.setdefault(h['provider'], 0)
        success_scores[h['provider']] += 1
    ordered = sorted(PROVIDERS, key=lambda p: -success_scores.get(p['name'], 0))
    return ordered


def run_loop(task, budget_limit=10.0):
    total_cost = 0
    history = []
    agents = list(PROVIDERS)

    for iteration in range(10):
        for provider in agents:
            retries = 0
            while retries < 3:
                try:
                    result = call_provider(provider, task, history)
                    total_cost += result['cost']
                    history.append(result)

                    if total_cost > budget_limit:
                        raise BudgetExceeded()

                    break
                except ProviderError:
                    retries += 1
                    time.sleep(0.5)
                    continue

        agents = reorder_agents(history)

    return {
        "status": "complete",
        "cost": total_cost,
        "history": history
    }
