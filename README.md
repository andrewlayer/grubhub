# Grubhub VS Code Extension

Order food from Grubhub directly through VS Code's Copilot Chat interface! This extension allows you to browse restaurants, add items to cart, and complete orders without leaving your development environment.

![@grubhub participant](https://storage.googleapis.com/generic-assets/grubhub_extension.png)

## Features

- List your favorite restaurants
- Browse restaurant menus
- Add items to cart
- Update delivery information
- View bill details
- Complete checkout
- Manage multiple carts

## Setup

1. Install the extension from the VS Code marketplace
2. Configure the required settings:

### Required Settings

- `grubhub.bearerToken`: Your Grubhub API Bearer Token
  - To get this token:
    1. Log into Grubhub in your browser
    2. Open Developer Tools (F12)
    3. Go to Network tab
    4. Look for requests to `https://api-gtm.grubhub.com/`
    5. Find the "Authorization" header value (starts with "Bearer")
    - Note: This token expires every few hours and will need to be updated
- `grubhub.address`: Your delivery address
  - Format: Simple address string (e.g. "550 jenson ave, San Jose, CA")
  - We use OpenStreetMap for geocoding - verify your address works at https://nominatim.openstreetmap.org/ui/
  - The extension will automatically convert this to coordinates for searching

### Important Notes

- You must have restaurants in your Grubhub favorites list to use the restaurant listing feature
- Add restaurants to your favorites on the Grubhub website
- After updating any settings, you may need to restart VS Code for changes to take effect
- If you encounter authentication errors, try getting a new bearer token

## Usage

1. Open VS Code's Copilot Chat
2. Select the Grubhub participant
3. Start ordering with natural language commands like:
   - "Show me my favorite restaurants"
   - "What's on the menu at [restaurant]?"
   - "Add [item] to my cart"
   - "Show my current bill"
   - "Complete my order"

## Troubleshooting

- Lol this is so stupid, email me andrewh@buildwithlayer.com if you really want this thing working.

## Known Issues
- [ ] Adding to cart doesn't always succeed for all restraunts (likely due to the missing params in the body of the `/carts/{{cart_id}}/lines` endpoint)
- [ ] Auth sucks because the bearer token expires every few hours

## Contributing

Want to contribute, be my guest.

## License

MIT
