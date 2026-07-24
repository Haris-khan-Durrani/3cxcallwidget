from pipecat.services.cartesia import CartesiaTTSService

def get_tts_service(provider_config):
    api_key = provider_config.get("api_key")
    if api_key:
        return CartesiaTTSService(
            api_key=api_key,
            voice_id="79a125e8-cd45-4c13-8a67-188112f4dd22" # default cartesia voice
        )
    raise ValueError("Missing Cartesia API Key in provider_config")
