/**
 * Babylon Inventory
 *
 * Manages player inventory for quest items and collected objects
 */

import { Scene } from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  type: 'quest' | 'collectible' | 'key' | 'consumable';
  quantity: number;
  icon?: string;
  questId?: string; // If this item is for a specific quest
}

export class BabylonInventory {
  private scene: Scene;
  private advancedTexture: GUI.AdvancedDynamicTexture;
  private container: GUI.Rectangle | null = null;
  private itemsContainer: GUI.StackPanel | null = null;
  private isVisible: boolean = false;

  private items: Map<string, InventoryItem> = new Map();
  private onItemAdded: ((item: InventoryItem) => void) | null = null;
  private onItemRemoved: ((itemId: string) => void) | null = null;

  constructor(scene: Scene, advancedTexture: GUI.AdvancedDynamicTexture) {
    this.scene = scene;
    this.advancedTexture = advancedTexture;

    this.createInventoryUI();
  }

  /**
   * Create the inventory UI
   */
  private createInventoryUI(): void {
    // Main container
    this.container = new GUI.Rectangle('inventoryContainer');
    this.container.width = '350px';
    this.container.height = '500px';
    this.container.cornerRadius = 10;
    this.container.color = 'white';
    this.container.thickness = 2;
    this.container.background = 'rgba(0, 0, 0, 0.85)';
    this.advancedTexture.addControl(this.container);

    // Center on screen
    this.container.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.container.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;

    // Title bar
    const titleBar = new GUI.Rectangle('inventoryTitleBar');
    titleBar.width = '350px';
    titleBar.height = '50px';
    titleBar.cornerRadius = 10;
    titleBar.background = 'rgba(40, 40, 40, 1)';
    titleBar.thickness = 0;
    titleBar.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    this.container.addControl(titleBar);

    // Title text
    const titleText = new GUI.TextBlock('inventoryTitle');
    titleText.text = 'Inventory';
    titleText.fontSize = 20;
    titleText.fontWeight = 'bold';
    titleText.color = 'white';
    titleText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    titleText.top = '15px';
    this.container.addControl(titleText);

    // Close button
    const closeButton = GUI.Button.CreateSimpleButton('inventoryClose', 'X');
    closeButton.width = '40px';
    closeButton.height = '40px';
    closeButton.color = 'white';
    closeButton.background = 'rgba(200, 50, 50, 0.8)';
    closeButton.cornerRadius = 5;
    closeButton.fontSize = 18;
    closeButton.fontWeight = 'bold';
    closeButton.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    closeButton.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    closeButton.top = '5px';
    closeButton.left = '-5px';
    closeButton.onPointerUpObservable.add(() => {
      this.hide();
    });
    this.container.addControl(closeButton);

    // Items scroll view
    const scrollViewer = new GUI.ScrollViewer('inventoryScroll');
    scrollViewer.width = '330px';
    scrollViewer.height = '430px';
    scrollViewer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    scrollViewer.top = '60px';
    scrollViewer.thickness = 0;
    scrollViewer.barColor = 'rgba(100, 100, 100, 0.8)';
    scrollViewer.barBackground = 'rgba(50, 50, 50, 0.5)';
    this.container.addControl(scrollViewer);

    // Items container (stack panel inside scroll viewer)
    this.itemsContainer = new GUI.StackPanel('inventoryItems');
    this.itemsContainer.width = '310px';
    this.itemsContainer.spacing = 5;
    scrollViewer.addControl(this.itemsContainer);

    // Initially hidden
    this.container.isVisible = false;
  }

  /**
   * Show inventory
   */
  public show(): void {
    if (this.container) {
      this.container.isVisible = true;
      this.isVisible = true;
      this.refreshItemList();
    }
  }

  /**
   * Hide inventory
   */
  public hide(): void {
    if (this.container) {
      this.container.isVisible = false;
      this.isVisible = false;
    }
  }

  /**
   * Toggle inventory visibility
   */
  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Add item to inventory
   */
  public addItem(item: InventoryItem): void {
    const existingItem = this.items.get(item.id);

    if (existingItem) {
      // If item already exists, increase quantity
      existingItem.quantity += item.quantity;
    } else {
      // Add new item
      this.items.set(item.id, { ...item });
    }

    this.refreshItemList();

    // Trigger callback
    if (this.onItemAdded) {
      this.onItemAdded(item);
    }
  }

  /**
   * Remove item from inventory
   */
  public removeItem(itemId: string, quantity: number = 1): boolean {
    const item = this.items.get(itemId);

    if (!item) {
      return false;
    }

    item.quantity -= quantity;

    if (item.quantity <= 0) {
      this.items.delete(itemId);
    }

    this.refreshItemList();

    // Trigger callback
    if (this.onItemRemoved) {
      this.onItemRemoved(itemId);
    }

    return true;
  }

  /**
   * Check if item exists in inventory
   */
  public hasItem(itemId: string): boolean {
    return this.items.has(itemId);
  }

  /**
   * Get item from inventory
   */
  public getItem(itemId: string): InventoryItem | undefined {
    return this.items.get(itemId);
  }

  /**
   * Get all items
   */
  public getAllItems(): InventoryItem[] {
    return Array.from(this.items.values());
  }

  /**
   * Clear all items
   */
  public clearAll(): void {
    this.items.clear();
    this.refreshItemList();
  }

  /**
   * Refresh the item list display
   */
  private refreshItemList(): void {
    if (!this.itemsContainer) return;

    // Clear existing items
    this.itemsContainer.clearControls();

    if (this.items.size === 0) {
      // Show empty message
      const emptyText = new GUI.TextBlock('emptyInventory');
      emptyText.text = 'Your inventory is empty';
      emptyText.height = '40px';
      emptyText.fontSize = 14;
      emptyText.color = '#888888';
      emptyText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
      this.itemsContainer.addControl(emptyText);
      return;
    }

    // Add each item
    for (const item of this.items.values()) {
      const itemCard = this.createItemCard(item);
      this.itemsContainer.addControl(itemCard);
    }
  }

  /**
   * Create an item card
   */
  private createItemCard(item: InventoryItem): GUI.Rectangle {
    const card = new GUI.Rectangle(`item_${item.id}`);
    card.width = '300px';
    card.height = '80px';
    card.cornerRadius = 5;
    card.color = 'rgba(150, 150, 150, 0.5)';
    card.thickness = 1;
    card.background = 'rgba(30, 30, 30, 0.8)';

    // Item name
    const nameText = new GUI.TextBlock(`item_name_${item.id}`);
    nameText.text = item.name;
    nameText.fontSize = 16;
    nameText.fontWeight = 'bold';
    nameText.color = this.getItemColor(item.type);
    nameText.height = '20px';
    nameText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    nameText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    nameText.top = '10px';
    nameText.left = '15px';
    nameText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    card.addControl(nameText);

    // Quantity badge
    if (item.quantity > 1) {
      const quantityBadge = new GUI.Rectangle(`item_qty_${item.id}`);
      quantityBadge.width = '40px';
      quantityBadge.height = '24px';
      quantityBadge.cornerRadius = 12;
      quantityBadge.background = 'rgba(100, 100, 255, 0.8)';
      quantityBadge.color = 'white';
      quantityBadge.thickness = 1;
      quantityBadge.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
      quantityBadge.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
      quantityBadge.top = '8px';
      quantityBadge.left = '-10px';
      card.addControl(quantityBadge);

      const quantityText = new GUI.TextBlock(`item_qty_text_${item.id}`);
      quantityText.text = `×${item.quantity}`;
      quantityText.fontSize = 12;
      quantityText.fontWeight = 'bold';
      quantityText.color = 'white';
      quantityBadge.addControl(quantityText);
    }

    // Item description
    if (item.description) {
      const descText = new GUI.TextBlock(`item_desc_${item.id}`);
      descText.text = item.description;
      descText.fontSize = 12;
      descText.color = '#CCCCCC';
      descText.height = '35px';
      descText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
      descText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      descText.top = '35px';
      descText.left = '15px';
      descText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      descText.textWrapping = true;
      card.addControl(descText);
    }

    return card;
  }

  /**
   * Get color for item type
   */
  private getItemColor(type: string): string {
    switch (type) {
      case 'quest':
        return '#FFD700'; // Gold for quest items
      case 'collectible':
        return '#87CEEB'; // Sky blue for collectibles
      case 'key':
        return '#FF6347'; // Tomato red for keys
      case 'consumable':
        return '#90EE90'; // Light green for consumables
      default:
        return 'white';
    }
  }

  /**
   * Set callback for when item is added
   */
  public setOnItemAdded(callback: (item: InventoryItem) => void): void {
    this.onItemAdded = callback;
  }

  /**
   * Set callback for when item is removed
   */
  public setOnItemRemoved(callback: (itemId: string) => void): void {
    this.onItemRemoved = callback;
  }

  /**
   * Dispose inventory
   */
  public dispose(): void {
    if (this.container) {
      this.advancedTexture.removeControl(this.container);
      this.container.dispose();
      this.container = null;
    }

    this.itemsContainer = null;
    this.items.clear();
  }
}
