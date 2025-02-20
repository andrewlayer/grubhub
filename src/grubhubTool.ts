import * as vscode from 'vscode';
import { grubhubClient } from './grubhubClient';

export function registerChatTools(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.lm.registerTool('grubhub-api_add_to_cart', new AddToCartTool()),
        vscode.lm.registerTool('grubhub-api_get_carts', new GetCartsTool()),
        vscode.lm.registerTool('grubhub-api_create_cart', new CreateCartTool()),
        vscode.lm.registerTool('grubhub-api_get_restaurant_items', new GetRestaurantItemsTool()),
        vscode.lm.registerTool('grubhub-api_update_delivery', new UpdateDeliveryInfoTool()),
        vscode.lm.registerTool('grubhub-api_get_bill', new GetBillTool()),
        vscode.lm.registerTool('grubhub-api_list_restaurants', new ListRestaurantsTool()),
        vscode.lm.registerTool('grubhub-api_checkout_cart', new CheckoutCartTool()),
        vscode.lm.registerTool('grubhub-api_delete_cart', new DeleteCartTool())
    );
}

interface AddToCartParameters {
    cart_id?: string;
    menu_item_id: string;
    restaurant_id: string;
    quantity?: number;
    special_instructions?: string;
    cost: number;
}

export class AddToCartTool implements vscode.LanguageModelTool<AddToCartParameters> {
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<AddToCartParameters>,
        _token: vscode.CancellationToken
    ) {
        const confirmationMessages = {
            title: 'Add Item to Cart',
            message: new vscode.MarkdownString(
                `Add ${options.input.quantity || 1} item(s) to cart?`
            ),
        };

        return {
            invocationMessage: 'Adding item to cart...',
            confirmationMessages,
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<AddToCartParameters>,
        _token: vscode.CancellationToken
    ) {
        const params = options.input;
        
        try {
            const response = await grubhubClient.addItemToCart(params.cart_id, {
                menu_item_id: params.menu_item_id,
                restaurant_id: params.restaurant_id,
                quantity: params.quantity || 1,
                special_instructions: params.special_instructions || ''
            });

            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Successfully added ${params.quantity || 1} item(s) to cart ${response.cart_id}. Checkout token: ${response.checkout_token}`
                )
            ]);
        } catch (error) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Failed to add item to cart: ${error instanceof Error ? error.message : 'Unknown error'}`
                )
            ]);
        }
    }
}

export class GetCartsTool implements vscode.LanguageModelTool<void> {
    async invoke(
        _options: vscode.LanguageModelToolInvocationOptions<void>,
        _token: vscode.CancellationToken
    ) {
        try {
            const response = await grubhubClient.getCarts();
            
            const cartSummaries = response.carts.map(cart => {
                const itemSummaries = cart.items.map(item => 
                    `${item.quantity}x ${item.name} ($${item.diner_total})`
                ).join('\n  ');
                
                return `Cart ${cart.cartId}:\n  ${itemSummaries || 'Empty cart'}`;
            }).join('\n\n');

            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    cartSummaries || 'No carts found'
                )
            ]);
        } catch (error) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Failed to get carts: ${error instanceof Error ? error.message : 'Unknown error'}`
                )
            ]);
        }
    }
}

export class CreateCartTool implements vscode.LanguageModelTool<void> {
    async invoke(
        _options: vscode.LanguageModelToolInvocationOptions<void>,
        _token: vscode.CancellationToken
    ) {
        try {
            const response = await grubhubClient.createCart();
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Successfully created new cart with ID: ${response.id}`
                )
            ]);
        } catch (error) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Failed to create cart: ${error instanceof Error ? error.message : 'Unknown error'}`
                )
            ]);
        }
    }
}

interface GetRestaurantItemsParameters {
    restaurant_id: string;
}

export class GetRestaurantItemsTool implements vscode.LanguageModelTool<GetRestaurantItemsParameters> {
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<GetRestaurantItemsParameters>,
        _token: vscode.CancellationToken
    ) {
        try {
            const response = await grubhubClient.getRestaurantItems(options.input.restaurant_id);
            
            const itemsList = response.items.map(item => 
                `- ${item.item_name} (ID: ${item.item_id})\n  ${item.item_description || 'No description available'}`
            ).join('\n\n');

            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    itemsList || 'No items found'
                )
            ]);
        } catch (error) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Failed to get restaurant items: ${error instanceof Error ? error.message : 'Unknown error'}`
                )
            ]);
        }
    }
}

interface UpdateDeliveryInfoParameters {
    cart_id: string;
    address_lines: string[];
    city: string;
    state: string;
    zip: string;
}

export class UpdateDeliveryInfoTool implements vscode.LanguageModelTool<UpdateDeliveryInfoParameters> {
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<UpdateDeliveryInfoParameters>,
        _token: vscode.CancellationToken
    ) {
        try {
            await grubhubClient.updateDeliveryInfo(
                options.input.cart_id,
                {
                    address_lines: options.input.address_lines,
                    city: options.input.city,
                    state: options.input.state,
                    zip: options.input.zip
                }
            );
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Successfully updated delivery info for cart ${options.input.cart_id}`
                )
            ]);
        } catch (error) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Failed to update delivery info: ${error instanceof Error ? error.message : 'Unknown error'}`
                )
            ]);
        }
    }
}

interface GetBillParameters {
    cart_id: string;
}

export class GetBillTool implements vscode.LanguageModelTool<GetBillParameters> {
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<GetBillParameters>,
        _token: vscode.CancellationToken
    ) {
        try {
            const bill = await grubhubClient.getBill(options.input.cart_id);
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Bill Summary:\n` +
                    `Subtotal: $${bill.subtotal.toFixed(2)}\n` +
                    `Tax: $${bill.tax.toFixed(2)}\n` +
                    `Delivery Fee: $${bill.delivery_fee.toFixed(2)}\n` +
                    `Service Fee: $${bill.service_fee.toFixed(2)}\n` +
                    `Tip: $${bill.tip.toFixed(2)}\n` +
                    (bill.small_order_fee ? `Small Order Fee: $${bill.small_order_fee.toFixed(2)}\n` : '') +
                    `Total: $${bill.total.toFixed(2)}`
                )
            ]);
        } catch (error) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Failed to get bill: ${error instanceof Error ? error.message : 'Unknown error'}`
                )
            ]);
        }
    }
}

export class ListRestaurantsTool implements vscode.LanguageModelTool<void> {
    async invoke(
        _options: vscode.LanguageModelToolInvocationOptions<void>,
        _token: vscode.CancellationToken
    ) {
        try {
            const restaurants = await grubhubClient.listRestaurants();
            const restaurantList = restaurants.map(r => 
                `${r.name} (ID: ${r.id})`
            ).join('\n\n');

            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    restaurantList || 'No favorite restaurants found'
                )
            ]);
        } catch (error) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Failed to list restaurants: ${error instanceof Error ? error.message : 'Unknown error'}`
                )
            ]);
        }
    }
}

interface CheckoutCartParameters {
    cart_id: string;
}

export class CheckoutCartTool implements vscode.LanguageModelTool<CheckoutCartParameters> {
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<CheckoutCartParameters>,
        _token: vscode.CancellationToken
    ) {
        // Get bill first to show details
        const bill = await grubhubClient.getBill(options.input.cart_id);
        
        if (!bill.ready) {
            throw new Error('Cart is not ready for checkout. Please ensure delivery info and payment method are set.');
        }

        const confirmationMessages = {
            title: 'Confirm Checkout',
            message: new vscode.MarkdownString(
                `Are you sure you want to place this order?\n\n` +
                `Bill Summary:\n` +
                `Subtotal: $${bill.subtotal.toFixed(2)}\n` +
                `Tax: $${bill.tax.toFixed(2)}\n` +
                `Delivery Fee: $${bill.delivery_fee.toFixed(2)}\n` +
                `Service Fee: $${bill.service_fee.toFixed(2)}\n` +
                `Tip: $${bill.tip.toFixed(2)}\n` +
                (bill.small_order_fee ? `Small Order Fee: $${bill.small_order_fee.toFixed(2)}\n` : '') +
                `Total: $${bill.total.toFixed(2)}`
            ),
        };

        return {
            invocationMessage: 'Processing checkout...',
            confirmationMessages,
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<CheckoutCartParameters>,
        _token: vscode.CancellationToken
    ) {
        try {
            const bill = await grubhubClient.getBill(options.input.cart_id);
            if (!bill.checkout_token) {
                throw new Error('No checkout token available. Please ensure cart is ready for checkout.');
            }

            const response = await grubhubClient.checkoutCart(options.input.cart_id, bill.checkout_token);
            
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Order placed successfully!\n` +
                    `Order Number: ${response.order_number}\n` +
                    `Estimated Delivery Time: ${response.ordering_info.estimate_range.minimum}-${response.ordering_info.estimate_range.maximum} minutes`
                )
            ]);
        } catch (error) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Failed to checkout cart: ${error instanceof Error ? error.message : 'Unknown error'}`
                )
            ]);
        }
    }
}

interface DeleteCartParameters {
    cart_id: string;
}

export class DeleteCartTool implements vscode.LanguageModelTool<DeleteCartParameters> {
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<DeleteCartParameters>,
        _token: vscode.CancellationToken
    ) {
        const confirmationMessages = {
            title: 'Delete Cart',
            message: new vscode.MarkdownString(
                `Are you sure you want to delete cart ${options.input.cart_id}?`
            ),
        };

        return {
            invocationMessage: 'Deleting cart...',
            confirmationMessages,
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<DeleteCartParameters>,
        _token: vscode.CancellationToken
    ) {
        try {
            await grubhubClient.deleteCart(options.input.cart_id);
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Successfully deleted cart ${options.input.cart_id}`
                )
            ]);
        } catch (error) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Failed to delete cart: ${error instanceof Error ? error.message : 'Unknown error'}`
                )
            ]);
        }
    }
}
