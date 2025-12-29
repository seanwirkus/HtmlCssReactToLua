import React, { useState, useEffect } from 'react';

// Bramblewick Keeper Phone - iOS Style with Square Icons
// Cozy island life companion with polished interactions

const KeeperPhone = () => {
  const [currentApp, setCurrentApp] = useState(null);
  const [time, setTime] = useState(new Date());
  const [coins, setCoins] = useState(2847);
  const [stamps, setStamps] = useState(34);
  const [weather] = useState('sunny');
  const [catalogCategory, setCatalogCategory] = useState('building');
  const [selectedItem, setSelectedItem] = useState(null);
  const [journalTab, setJournalTab] = useState('discoveries');
  const [scanMode, setScanMode] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [hoveredApp, setHoveredApp] = useState(null);
  const [pressedApp, setPressedApp] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [appTransition, setAppTransition] = useState(false);

  const [deliveryQueue] = useState([
    { id: 1, name: 'Glass Panes', quantity: 10, arriving: 'Dawn', icon: '🪟', progress: 65 },
    { id: 2, name: 'Oak Seeds', quantity: 5, arriving: 'Dusk', icon: '🌱', progress: 30 }
  ]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const showToast = (message) => setToastMessage(message);

  const openApp = (appId) => {
    setAppTransition(true);
    setTimeout(() => {
      setCurrentApp(appId);
      setAppTransition(false);
    }, 100);
  };

  const closeApp = () => {
    setAppTransition(true);
    setTimeout(() => {
      setCurrentApp(null);
      setScanResult(null);
      setSelectedItem(null);
      setSelectedResident(null);
      setAppTransition(false);
    }, 100);
  };

  // App definitions with emojis as icons
  const apps = [
    { id: 'look', name: 'Look', emoji: '🔍', gradient: ['#34C759', '#28A745'] },
    { id: 'order', name: 'Order', emoji: '✈️', gradient: ['#FF9500', '#E68A00'] },
    { id: 'journal', name: 'Journal', emoji: '📔', gradient: ['#8B5A2B', '#704A23'] },
    { id: 'friends', name: 'Friends', emoji: '💛', gradient: ['#FF6B9D', '#E85A8C'] },
    { id: 'map', name: 'Map', emoji: '🗺️', gradient: ['#5AC8FA', '#4AB8EA'] },
    { id: 'mail', name: 'Mail', emoji: '📬', gradient: ['#AF52DE', '#9A42C9'] },
    { id: 'weather', name: 'Weather', emoji: '🌤️', gradient: ['#64D2FF', '#54C2EF'] },
    { id: 'settings', name: 'Settings', emoji: '⚙️', gradient: ['#8E8E93', '#636366'] },
  ];

  const catalogItems = {
    building: [
      { id: 1, name: 'Reclaimed Wood', coins: 25, stamps: 0, qty: 'x10', icon: '🪵', desc: 'Weathered planks from old structures', tier: 1 },
      { id: 2, name: 'Stone Brick', coins: 40, stamps: 0, qty: 'x10', icon: '🧱', desc: 'Sturdy building blocks', tier: 1 },
      { id: 3, name: 'Iron Beam', coins: 80, stamps: 0, qty: 'x5', icon: '🔩', desc: 'Structural support', tier: 2 },
      { id: 4, name: 'Glass Panes', coins: 60, stamps: 0, qty: 'x10', icon: '🪟', desc: 'Let the light in', tier: 1 },
      { id: 5, name: 'Copper Pipe', coins: 45, stamps: 0, qty: 'x8', icon: '🔧', desc: 'Plumbing essentials', tier: 2 },
      { id: 6, name: 'Fresnel Lens', coins: 0, stamps: 25, qty: 'x1', icon: '💎', desc: 'Lighthouse component', tier: 4 },
    ],
    seeds: [
      { id: 7, name: 'Tomato Seeds', coins: 15, stamps: 0, qty: 'x5', icon: '🍅', desc: 'Ripe in 4 days', tier: 1 },
      { id: 8, name: 'Sunflower Seeds', coins: 20, stamps: 0, qty: 'x5', icon: '🌻', desc: 'Brightens any garden', tier: 1 },
      { id: 9, name: 'Lavender Seeds', coins: 30, stamps: 0, qty: 'x5', icon: '💜', desc: 'Calming fragrance', tier: 2 },
      { id: 10, name: 'Ancient Oak Acorn', coins: 0, stamps: 10, qty: 'x1', icon: '🌳', desc: 'Grows for generations', tier: 4 },
    ],
    furniture: [
      { id: 11, name: 'Wooden Bench', coins: 120, stamps: 0, qty: 'x1', icon: '🪑', desc: 'Rest your feet', tier: 1 },
      { id: 12, name: 'Lantern Post', coins: 80, stamps: 0, qty: 'x1', icon: '🏮', desc: 'Light the way', tier: 1 },
      { id: 13, name: 'Vintage Mailbox', coins: 0, stamps: 8, qty: 'x1', icon: '📬', desc: 'Classic design', tier: 3 },
    ],
    tools: [
      { id: 14, name: 'Weed Whacker', coins: 200, stamps: 0, qty: 'x1', icon: '🌿', desc: 'Clear overgrowth', tier: 1 },
      { id: 15, name: 'Metal Detector', coins: 0, stamps: 20, qty: 'x1', icon: '📡', desc: 'Find buried treasure', tier: 3 },
      { id: 16, name: 'Fishing Rod', coins: 150, stamps: 0, qty: 'x1', icon: '🎣', desc: 'Catch dinner', tier: 1 },
    ]
  };

  const residents = [
    { id: 1, name: 'Barnaby', role: 'Mail Carrier', icon: '🦅', hearts: 4, maxHearts: 5, status: 'At the dock', request: 'Waiting for you to visit', color: '#5D8AA8', bio: 'The old pelican has been flying the mail route for decades.' },
    { id: 2, name: 'Wren', role: 'Gardener', icon: '🐦', hearts: 3, maxHearts: 5, status: 'In the greenhouse', request: 'Needs 5 lavender seeds', color: '#7BA87B', bio: 'A cheerful young woman with a mysterious connection to the island.' },
    { id: 3, name: 'Cogsworth', role: 'Clockmaker', icon: '🦉', hearts: 2, maxHearts: 5, status: 'Clock tower', request: 'Looking for gears', color: '#C4956A', bio: 'The nervous tinkerer obsessed with fixing the old clock tower.' },
    { id: 4, name: 'Ember', role: 'Baker', icon: '🐿️', hearts: 5, maxHearts: 5, status: 'Bakery', request: null, color: '#E8945A', bio: 'Makes the best bread on the island. Always has a warm smile.' },
  ];

  const discoveries = [
    { id: 1, name: 'Monarch Butterfly', category: 'Insects', found: true, icon: '🦋', rarity: 'common' },
    { id: 2, name: 'Driftwood', category: 'Materials', found: true, icon: '🪵', rarity: 'common' },
    { id: 3, name: 'Sea Glass', category: 'Treasures', found: true, icon: '💎', rarity: 'uncommon' },
    { id: 4, name: 'Ancient Coin', category: 'Artifacts', found: false, icon: '🪙', rarity: 'rare' },
    { id: 5, name: 'Painted Lady', category: 'Insects', found: false, icon: '🦋', rarity: 'uncommon' },
    { id: 6, name: 'Starfish', category: 'Sea Life', found: true, icon: '⭐', rarity: 'common' },
    { id: 7, name: 'Message Bottle', category: 'Artifacts', found: true, icon: '🍾', rarity: 'rare' },
    { id: 8, name: 'Hermit Crab', category: 'Sea Life', found: true, icon: '🦀', rarity: 'common' },
  ];

  const stampCollection = [
    { id: 1, name: 'First Landing', earned: true, icon: '🏝️', value: 5, desc: 'Arrived on Bramblewick', date: 'Day 1' },
    { id: 2, name: 'First Harvest', earned: true, icon: '🌾', value: 5, desc: 'Grew your first crop', date: 'Day 4' },
    { id: 3, name: 'Lighthouse Keeper', earned: false, icon: '🗼', value: 25, desc: 'Restore the lighthouse' },
    { id: 4, name: 'Full House', earned: false, icon: '👥', value: 20, desc: 'All residents moved in' },
    { id: 5, name: 'Master Angler', earned: true, icon: '🐟', value: 10, desc: 'Catch 50 fish', date: 'Day 8' },
    { id: 6, name: 'Treasure Hunter', earned: true, icon: '💰', value: 15, desc: 'Find 20 buried items', date: 'Day 6' },
  ];

  const journalEntries = [
    { id: 1, date: 'Day 12', title: 'Found the old well', content: 'Hidden behind the brambles near the lighthouse...', mood: '🤔' },
    { id: 2, date: 'Day 8', title: 'Barnaby told a story', content: 'He mentioned someone named Margot...', mood: '😢' },
    { id: 3, date: 'Day 3', title: 'First sunrise', content: 'The light through the fog was incredible...', mood: '✨' },
  ];

  const weatherForecast = [
    { day: 'Today', icon: '☀️', high: 72, low: 58 },
    { day: 'Tue', icon: '⛅', high: 68, low: 55 },
    { day: 'Wed', icon: '🌧️', high: 62, low: 52 },
    { day: 'Thu', icon: '☀️', high: 70, low: 56 },
    { day: 'Fri', icon: '🌤️', high: 74, low: 60 },
  ];

  const addToCart = (item) => {
    setCartItems([...cartItems, item]);
    showToast(`Added ${item.name} to cart`);
  };

  const handleScan = () => {
    setScanMode(true);
    setTimeout(() => {
      setScanResult({
        name: 'Monarch Butterfly',
        scientificName: 'Danaus plexippus',
        type: 'Insect',
        fact: 'Monarchs travel up to 3,000 miles during migration. Their orange color warns predators they taste bitter!',
        rarity: 'Common',
        season: 'Spring - Fall',
        habitat: 'Meadows & Gardens',
      });
      setScanMode(false);
    }, 2000);
  };

  // Status Bar
  const StatusBar = ({ light = false }) => (
    <div style={{...styles.statusBar, color: light ? '#fff' : '#000'}}>
      <span style={styles.statusTime}>{formatTime(time)}</span>
      <div style={styles.dynamicIsland} />
      <div style={styles.statusRight}>
        <div style={styles.signalBars}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{
              ...styles.signalBar,
              height: 4 + i * 2,
              background: light ? '#fff' : '#000',
              opacity: i <= 3 ? 1 : 0.3
            }} />
          ))}
        </div>
        <span style={{fontSize: 14, fontWeight: 600}}>100%</span>
        <div style={{...styles.battery, borderColor: light ? '#fff' : '#000'}}>
          <div style={{...styles.batteryFill, background: light ? '#fff' : '#000'}} />
        </div>
      </div>
    </div>
  );

  // Toast
  const Toast = () => (
    <div style={styles.toast}>
      <span style={styles.toastIcon}>✓</span>
      <span>{toastMessage}</span>
    </div>
  );

  // Home Screen
  const HomeScreen = () => (
    <div style={styles.homeScreen}>
      <StatusBar />
      
      {/* Date Widget */}
      <div style={styles.dateWidget}>
        <div style={styles.dateDay}>{formatDate(time)}</div>
      </div>

      {/* Currency Card */}
      <div style={styles.currencyCard}>
        <div style={styles.currencyHalf}>
          <span style={styles.currencyEmoji}>🪙</span>
          <div style={styles.currencyText}>
            <span style={styles.currencyLabel}>Coins</span>
            <span style={styles.currencyValue}>{coins.toLocaleString()}</span>
          </div>
        </div>
        <div style={styles.currencyDivider} />
        <div style={styles.currencyHalf}>
          <span style={styles.currencyEmoji}>📮</span>
          <div style={styles.currencyText}>
            <span style={styles.currencyLabel}>Stamps</span>
            <span style={styles.currencyValue}>{stamps}</span>
          </div>
        </div>
      </div>

      {/* Delivery Card */}
      {deliveryQueue.length > 0 && (
        <div style={styles.deliveryCard}>
          <div style={styles.deliveryTop}>
            <div style={styles.deliveryIcon}>✈️</div>
            <div style={styles.deliveryInfo}>
              <span style={styles.deliveryLabel}>Next Delivery</span>
              <span style={styles.deliveryTime}>{deliveryQueue[0].arriving}</span>
            </div>
            <div style={styles.deliveryItems}>
              {deliveryQueue.slice(0, 2).map(item => (
                <span key={item.id} style={styles.deliveryItemIcon}>{item.icon}</span>
              ))}
            </div>
          </div>
          <div style={styles.deliveryProgress}>
            <div style={{...styles.deliveryProgressFill, width: `${deliveryQueue[0].progress}%`}} />
          </div>
        </div>
      )}

      {/* App Grid - iOS Style */}
      <div style={styles.appGrid}>
        {apps.map((app) => (
          <div
            key={app.id}
            style={styles.appWrapper}
            onMouseEnter={() => setHoveredApp(app.id)}
            onMouseLeave={() => { setHoveredApp(null); setPressedApp(null); }}
            onMouseDown={() => setPressedApp(app.id)}
            onMouseUp={() => setPressedApp(null)}
            onClick={() => openApp(app.id)}
          >
            <div style={{
              ...styles.appIcon,
              background: `linear-gradient(145deg, ${app.gradient[0]} 0%, ${app.gradient[1]} 100%)`,
              transform: pressedApp === app.id 
                ? 'scale(0.85)' 
                : hoveredApp === app.id 
                  ? 'scale(1.08)' 
                  : 'scale(1)',
              boxShadow: hoveredApp === app.id
                ? `0 8px 25px ${app.gradient[1]}50`
                : `0 4px 12px ${app.gradient[1]}30`,
            }}>
              <span style={styles.appEmoji}>{app.emoji}</span>
            </div>
            <span style={styles.appLabel}>{app.name}</span>
          </div>
        ))}
      </div>

      {/* Quote */}
      <div style={styles.quoteCard}>
        <div style={styles.quoteContent}>
          <span style={styles.quoteIcon}>📜</span>
          <div>
            <p style={styles.quoteText}>"The brambles are patient. So should we be."</p>
            <p style={styles.quoteAuthor}>— Margot's Journal</p>
          </div>
        </div>
      </div>

      {/* Home Indicator */}
      <div style={styles.homeIndicator} />
    </div>
  );

  // App Header
  const AppHeader = ({ title, rightContent }) => (
    <div style={styles.appHeader}>
      <button style={styles.backBtn} onClick={closeApp}>
        <span style={styles.backChevron}>‹</span>
        <span style={styles.backText}>Back</span>
      </button>
      <h1 style={styles.headerTitle}>{title}</h1>
      <div style={styles.headerRight}>{rightContent || <div style={{width: 60}} />}</div>
    </div>
  );

  // Look App
  const LookApp = () => (
    <div style={styles.appScreen}>
      <StatusBar />
      <AppHeader title="Look" />
      
      <div style={styles.lookContent}>
        {!scanMode && !scanResult && (
          <>
            <div style={styles.viewfinder}>
              <div style={styles.viewfinderInner}>
                <div style={{...styles.corner, top: 0, left: 0}} />
                <div style={{...styles.corner, top: 0, right: 0, transform: 'rotate(90deg)'}} />
                <div style={{...styles.corner, bottom: 0, left: 0, transform: 'rotate(-90deg)'}} />
                <div style={{...styles.corner, bottom: 0, right: 0, transform: 'rotate(180deg)'}} />
                <span style={styles.viewfinderHint}>Point at something</span>
              </div>
            </div>
            
            <button style={styles.scanBtn} onClick={handleScan}>
              <span>🔍</span>
              <span>Scan</span>
            </button>

            <div style={styles.recentSection}>
              <h3 style={styles.sectionTitle}>Recent Discoveries</h3>
              <div style={styles.recentList}>
                {discoveries.filter(d => d.found).slice(0, 3).map(item => (
                  <div key={item.id} style={styles.recentItem}>
                    <span style={styles.recentIcon}>{item.icon}</span>
                    <span style={styles.recentName}>{item.name}</span>
                    <span style={{
                      ...styles.rarityTag,
                      background: item.rarity === 'rare' ? '#AF52DE' : 
                                  item.rarity === 'uncommon' ? '#5AC8FA' : '#8E8E93'
                    }}>{item.rarity}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {scanMode && (
          <div style={styles.scanningView}>
            <div style={styles.scanningFrame}>
              <span style={styles.scanningEmoji}>🦋</span>
              <div style={styles.scanLine} />
            </div>
            <p style={styles.scanningText}>Analyzing...</p>
          </div>
        )}

        {scanResult && (
          <div style={styles.resultCard}>
            <div style={styles.resultTop}>
              <span style={styles.resultEmoji}>🦋</span>
              <div style={styles.resultInfo}>
                <h2 style={styles.resultName}>{scanResult.name}</h2>
                <p style={styles.resultScientific}>{scanResult.scientificName}</p>
                <div style={styles.resultTags}>
                  <span style={styles.resultTag}>{scanResult.type}</span>
                  <span style={{...styles.resultTag, background: '#34C759'}}>{scanResult.rarity}</span>
                </div>
              </div>
            </div>
            
            <div style={styles.resultDivider} />
            
            <div style={styles.factSection}>
              <h4 style={styles.factTitle}>📚 Did you know?</h4>
              <p style={styles.factText}>{scanResult.fact}</p>
            </div>

            <div style={styles.resultMeta}>
              <div style={styles.metaItem}>
                <span>🌸</span>
                <span>{scanResult.season}</span>
              </div>
              <div style={styles.metaItem}>
                <span>🏕️</span>
                <span>{scanResult.habitat}</span>
              </div>
            </div>

            <button style={styles.learnMoreBtn}>
              Learn More →
            </button>
            
            <button style={styles.scanAgainBtn} onClick={() => setScanResult(null)}>
              Scan Something Else
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Order App
  const OrderApp = () => (
    <div style={styles.appScreen}>
      <StatusBar />
      <AppHeader 
        title="Order" 
        rightContent={
          <button style={styles.cartBtn} onClick={() => setShowCart(true)}>
            🛒
            {cartItems.length > 0 && (
              <span style={styles.cartBadge}>{cartItems.length}</span>
            )}
          </button>
        }
      />

      {/* Categories */}
      <div style={styles.categoryRow}>
        {Object.keys(catalogItems).map(cat => (
          <button
            key={cat}
            style={{
              ...styles.categoryBtn,
              ...(catalogCategory === cat ? styles.categoryBtnActive : {})
            }}
            onClick={() => setCatalogCategory(cat)}
          >
            {cat === 'building' && '🏗️'}
            {cat === 'seeds' && '🌱'}
            {cat === 'furniture' && '🪑'}
            {cat === 'tools' && '🔧'}
            <span>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
          </button>
        ))}
      </div>

      {/* Items */}
      <div style={styles.catalogScroll}>
        <div style={styles.catalogGrid}>
          {catalogItems[catalogCategory].map(item => (
            <div
              key={item.id}
              style={{
                ...styles.itemCard,
                ...(selectedItem?.id === item.id ? styles.itemCardSelected : {})
              }}
              onClick={() => setSelectedItem(item)}
            >
              <span style={styles.itemEmoji}>{item.icon}</span>
              <span style={styles.itemName}>{item.name}</span>
              <span style={styles.itemQty}>{item.qty}</span>
              <div style={styles.itemPrice}>
                {item.coins > 0 ? `🪙 ${item.coins}` : `📮 ${item.stamps}`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedItem && (
        <div style={styles.detailPanel}>
          <div style={styles.detailTop}>
            <span style={styles.detailEmoji}>{selectedItem.icon}</span>
            <div style={styles.detailInfo}>
              <h3 style={styles.detailName}>{selectedItem.name}</h3>
              <p style={styles.detailDesc}>{selectedItem.desc}</p>
            </div>
          </div>
          <div style={styles.detailBottom}>
            <span style={styles.detailPrice}>
              {selectedItem.coins > 0 ? `🪙 ${selectedItem.coins}` : `📮 ${selectedItem.stamps}`}
            </span>
            <button style={styles.addBtn} onClick={() => addToCart(selectedItem)}>
              Add to Order
            </button>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div style={styles.modalOverlay} onClick={() => setShowCart(false)}>
          <div style={styles.cartModal} onClick={e => e.stopPropagation()}>
            <div style={styles.cartHeader}>
              <h3>Your Order</h3>
              <button style={styles.closeBtn} onClick={() => setShowCart(false)}>✕</button>
            </div>
            {cartItems.length === 0 ? (
              <div style={styles.cartEmpty}>
                <span>📦</span>
                <p>Your cart is empty</p>
              </div>
            ) : (
              <>
                <div style={styles.cartList}>
                  {cartItems.map((item, i) => (
                    <div key={i} style={styles.cartItem}>
                      <span>{item.icon}</span>
                      <span style={styles.cartItemName}>{item.name}</span>
                      <button 
                        style={styles.removeBtn}
                        onClick={() => {
                          const newCart = [...cartItems];
                          newCart.splice(i, 1);
                          setCartItems(newCart);
                        }}
                      >✕</button>
                    </div>
                  ))}
                </div>
                <button 
                  style={styles.checkoutBtn}
                  onClick={() => {
                    showToast('Order placed! ✈️');
                    setCartItems([]);
                    setShowCart(false);
                  }}
                >
                  Place Order
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Journal App
  const JournalApp = () => (
    <div style={styles.appScreen}>
      <StatusBar />
      <AppHeader title="Journal" />

      <div style={styles.tabRow}>
        {['discoveries', 'entries', 'recipes'].map(tab => (
          <button
            key={tab}
            style={{
              ...styles.tabBtn,
              ...(journalTab === tab ? styles.tabBtnActive : {})
            }}
            onClick={() => setJournalTab(tab)}
          >
            {tab === 'discoveries' && '🔍'}
            {tab === 'entries' && '📝'}
            {tab === 'recipes' && '📖'}
            <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
          </button>
        ))}
      </div>

      <div style={styles.journalContent}>
        {journalTab === 'discoveries' && (
          <>
            <div style={styles.progressBar}>
              <div style={styles.progressFill}>
                {discoveries.filter(d => d.found).length}/{discoveries.length}
              </div>
            </div>
            <div style={styles.discoveryGrid}>
              {discoveries.map(item => (
                <div key={item.id} style={{
                  ...styles.discoveryCard,
                  opacity: item.found ? 1 : 0.4
                }}>
                  <span style={styles.discoveryEmoji}>{item.found ? item.icon : '❓'}</span>
                  <span style={styles.discoveryName}>{item.found ? item.name : '???'}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {journalTab === 'entries' && (
          <div style={styles.entriesList}>
            {journalEntries.map(entry => (
              <div key={entry.id} style={styles.entryCard}>
                <div style={styles.entryHeader}>
                  <span style={styles.entryMood}>{entry.mood}</span>
                  <span style={styles.entryDate}>{entry.date}</span>
                </div>
                <h4 style={styles.entryTitle}>{entry.title}</h4>
                <p style={styles.entryText}>{entry.content}</p>
              </div>
            ))}
          </div>
        )}

        {journalTab === 'recipes' && (
          <div style={styles.recipeList}>
            <div style={styles.recipeCard}>
              <span style={styles.recipeEmoji}>🍞</span>
              <div style={styles.recipeInfo}>
                <h4>Brambleberry Bread</h4>
                <p>Wheat • Brambleberries • Honey</p>
              </div>
              <span style={styles.recipeCheck}>✓</span>
            </div>
            <div style={styles.recipeCard}>
              <span style={styles.recipeEmoji}>🥧</span>
              <div style={styles.recipeInfo}>
                <h4>Apple Pie</h4>
                <p>Apples • Flour • Sugar</p>
              </div>
              <span style={styles.recipeCheck}>✓</span>
            </div>
            <div style={{...styles.recipeCard, opacity: 0.5}}>
              <span style={styles.recipeEmoji}>❓</span>
              <div style={styles.recipeInfo}>
                <h4>???</h4>
                <p>Learn from Ember</p>
              </div>
              <span style={styles.recipeLock}>🔒</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Friends App
  const FriendsApp = () => (
    <div style={styles.appScreen}>
      <StatusBar />
      <AppHeader title="Friends" />

      <div style={styles.friendsContent}>
        {!selectedResident ? (
          <>
            <div style={styles.friendsGrid}>
              {residents.map(res => (
                <div 
                  key={res.id} 
                  style={styles.friendCard}
                  onClick={() => setSelectedResident(res)}
                >
                  <div style={{
                    ...styles.friendAvatar,
                    background: `linear-gradient(135deg, ${res.color}, ${res.color}cc)`
                  }}>
                    <span style={styles.friendEmoji}>{res.icon}</span>
                  </div>
                  <div style={styles.friendInfo}>
                    <h4 style={styles.friendName}>{res.name}</h4>
                    <span style={styles.friendRole}>{res.role}</span>
                    <div style={styles.hearts}>
                      {[...Array(res.maxHearts)].map((_, i) => (
                        <span key={i} style={{opacity: i < res.hearts ? 1 : 0.3}}>❤️</span>
                      ))}
                    </div>
                  </div>
                  {res.request && <div style={styles.requestDot} />}
                </div>
              ))}
            </div>

            <div style={styles.boardCard}>
              <div style={styles.boardHeader}>
                <span>📋</span>
                <h3>Community Board</h3>
              </div>
              <div style={styles.boardNote}>
                <span style={styles.pin}>📌</span>
                <p>"Looking for help restoring the bakery!"</p>
                <span style={styles.noteAuthor}>— Ember</span>
              </div>
            </div>
          </>
        ) : (
          <div style={styles.residentDetail}>
            <div style={{
              ...styles.residentAvatar,
              background: `linear-gradient(135deg, ${selectedResident.color}, ${selectedResident.color}cc)`
            }}>
              <span style={styles.residentEmoji}>{selectedResident.icon}</span>
            </div>
            <h2 style={styles.residentName}>{selectedResident.name}</h2>
            <span style={styles.residentRole}>{selectedResident.role}</span>
            <div style={styles.residentHearts}>
              {[...Array(selectedResident.maxHearts)].map((_, i) => (
                <span key={i} style={{fontSize: 24, opacity: i < selectedResident.hearts ? 1 : 0.3}}>❤️</span>
              ))}
            </div>
            <p style={styles.residentBio}>{selectedResident.bio}</p>
            <div style={styles.residentStatus}>
              <span>📍 {selectedResident.status}</span>
            </div>
            {selectedResident.request && (
              <div style={styles.residentRequest}>
                <span>💬</span>
                <p>{selectedResident.request}</p>
              </div>
            )}
            <button 
              style={styles.visitBtn}
              onClick={() => showToast(`Visiting ${selectedResident.name}...`)}
            >
              Visit
            </button>
            <button 
              style={styles.backToFriends}
              onClick={() => setSelectedResident(null)}
            >
              ← Back to Friends
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Map App
  const MapApp = () => (
    <div style={styles.appScreen}>
      <StatusBar />
      <AppHeader title="Map" />

      <div style={styles.mapContent}>
        <div style={styles.mapView}>
          <div style={styles.ocean} />
          <div style={styles.island}>
            <div style={{...styles.marker, left: '25%', top: '65%'}}>
              <span>⚓</span>
              <span style={styles.markerLabel}>Dock</span>
            </div>
            <div style={{...styles.marker, left: '40%', top: '45%'}}>
              <span>🏠</span>
              <span style={styles.markerLabel}>Cottage</span>
            </div>
            <div style={{...styles.marker, left: '65%', top: '30%', opacity: 0.5}}>
              <span>🗼</span>
              <span style={styles.markerLabel}>Lighthouse</span>
            </div>
            <div style={styles.fog} />
          </div>
        </div>

        <div style={styles.mapStats}>
          <div style={styles.mapStat}>
            <span style={styles.statValue}>23%</span>
            <span style={styles.statLabel}>Explored</span>
          </div>
          <div style={styles.mapStat}>
            <span style={styles.statValue}>5/18</span>
            <span style={styles.statLabel}>Locations</span>
          </div>
          <div style={styles.mapStat}>
            <span style={styles.statValue}>12</span>
            <span style={styles.statLabel}>Treasures</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Mail/Stamps App
  const MailApp = () => (
    <div style={styles.appScreen}>
      <StatusBar />
      <AppHeader 
        title="Mail" 
        rightContent={
          <div style={styles.stampCount}>
            <span>📮</span>
            <span>{stamps}</span>
          </div>
        }
      />

      <div style={styles.mailContent}>
        <div style={styles.stampBook}>
          <h3 style={styles.stampBookTitle}>Stamp Collection</h3>
          <p style={styles.stampBookSub}>
            {stampCollection.filter(s => s.earned).length}/{stampCollection.length} collected
          </p>
        </div>

        <div style={styles.stampGrid}>
          {stampCollection.map(stamp => (
            <div 
              key={stamp.id}
              style={{
                ...styles.stampCard,
                opacity: stamp.earned ? 1 : 0.4
              }}
            >
              <div style={styles.stampPerf}>
                {[...Array(6)].map((_, i) => <div key={i} style={styles.perf} />)}
              </div>
              <div style={styles.stampInner}>
                <span style={styles.stampEmoji}>{stamp.earned ? stamp.icon : '❓'}</span>
                <span style={styles.stampName}>{stamp.earned ? stamp.name : '???'}</span>
                <span style={styles.stampValue}>+{stamp.value} 📮</span>
              </div>
              <div style={{...styles.stampPerf, bottom: 0, top: 'auto'}}>
                {[...Array(6)].map((_, i) => <div key={i} style={styles.perf} />)}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.tipCard}>
          <span>💡</span>
          <p>Earn stamps by completing milestones and helping residents!</p>
        </div>
      </div>
    </div>
  );

  // Weather App
  const WeatherApp = () => (
    <div style={styles.weatherScreen}>
      <StatusBar light />
      
      <button style={styles.weatherBack} onClick={closeApp}>
        <span>‹</span>
        <span>Back</span>
      </button>

      <div style={styles.weatherHero}>
        <span style={styles.weatherIcon}>☀️</span>
        <span style={styles.weatherTemp}>72°</span>
        <span style={styles.weatherCondition}>Sunny</span>
        <span style={styles.weatherLocation}>📍 Bramblewick Island</span>
      </div>

      <div style={styles.weatherDetails}>
        <div style={styles.weatherDetail}>
          <span>💧</span>
          <span>45%</span>
          <span>Humidity</span>
        </div>
        <div style={styles.weatherDetail}>
          <span>💨</span>
          <span>8 mph</span>
          <span>Wind</span>
        </div>
        <div style={styles.weatherDetail}>
          <span>🌊</span>
          <span>Low</span>
          <span>Tide</span>
        </div>
      </div>

      <div style={styles.forecastSection}>
        <h4 style={styles.forecastTitle}>5-Day Forecast</h4>
        <div style={styles.forecastRow}>
          {weatherForecast.map((day, i) => (
            <div key={i} style={styles.forecastItem}>
              <span style={styles.forecastDay}>{day.day}</span>
              <span style={styles.forecastIcon}>{day.icon}</span>
              <span style={styles.forecastHigh}>{day.high}°</span>
              <span style={styles.forecastLow}>{day.low}°</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Settings App
  const SettingsApp = () => (
    <div style={styles.appScreen}>
      <StatusBar />
      <AppHeader title="Settings" />

      <div style={styles.settingsContent}>
        <div style={styles.settingsGroup}>
          <h4 style={styles.settingsGroupTitle}>Account</h4>
          <div style={styles.settingsCard}>
            <div style={styles.settingsRow}>
              <span>👤</span>
              <span style={styles.settingsLabel}>Keeper Profile</span>
              <span style={styles.chevron}>›</span>
            </div>
            <div style={styles.settingsRow}>
              <span>📊</span>
              <span style={styles.settingsLabel}>Statistics</span>
              <span style={styles.chevron}>›</span>
            </div>
          </div>
        </div>

        <div style={styles.settingsGroup}>
          <h4 style={styles.settingsGroupTitle}>Preferences</h4>
          <div style={styles.settingsCard}>
            <div style={styles.settingsRow}>
              <span>🔔</span>
              <span style={styles.settingsLabel}>Notifications</span>
              <div style={styles.toggle}>
                <div style={styles.toggleThumb} />
              </div>
            </div>
            <div style={styles.settingsRow}>
              <span>🔊</span>
              <span style={styles.settingsLabel}>Sound</span>
              <div style={{...styles.toggle, background: '#34C759'}}>
                <div style={{...styles.toggleThumb, left: 22}} />
              </div>
            </div>
            <div style={styles.settingsRow}>
              <span>🎵</span>
              <span style={styles.settingsLabel}>Music</span>
              <div style={{...styles.toggle, background: '#34C759'}}>
                <div style={{...styles.toggleThumb, left: 22}} />
              </div>
            </div>
          </div>
        </div>

        <p style={styles.settingsFooter}>
          Keeper Phone v1.0<br/>
          Made with 💚 for island life
        </p>
      </div>
    </div>
  );

  // Render
  const renderApp = () => {
    switch (currentApp) {
      case 'look': return <LookApp />;
      case 'order': return <OrderApp />;
      case 'journal': return <JournalApp />;
      case 'friends': return <FriendsApp />;
      case 'map': return <MapApp />;
      case 'mail': return <MailApp />;
      case 'weather': return <WeatherApp />;
      case 'settings': return <SettingsApp />;
      default: return <HomeScreen />;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.phone}>
        <div style={styles.phoneFrame}>
          <div style={{
            ...styles.screen,
            opacity: appTransition ? 0.9 : 1,
            transform: appTransition ? 'scale(0.98)' : 'scale(1)',
          }}>
            {renderApp()}
          </div>
        </div>
      </div>

      {toastMessage && <Toast />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        @keyframes scanLine {
          0%, 100% { top: 10%; }
          50% { top: 80%; }
        }

        @keyframes toastSlide {
          0% { transform: translateX(-50%) translateY(-20px); opacity: 0; }
          100% { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// Styles
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a2f25 0%, #2d4a3e 50%, #1a2f25 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    padding: 20,
  },

  phone: {
    position: 'relative',
  },

  phoneFrame: {
    width: 390,
    height: 844,
    background: '#1c1c1e',
    borderRadius: 55,
    padding: 12,
    boxShadow: '0 50px 100px -20px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1)',
  },

  screen: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
    overflow: 'hidden',
    background: 'linear-gradient(180deg, #FDF8F0 0%, #F5ECD8 100%)',
    transition: 'all 0.1s ease',
  },

  // Status Bar
  statusBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 24px 0',
    height: 52,
  },

  statusTime: {
    fontSize: 16,
    fontWeight: 600,
    width: 54,
  },

  dynamicIsland: {
    width: 126,
    height: 36,
    background: '#000',
    borderRadius: 20,
  },

  statusRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    width: 54,
    justifyContent: 'flex-end',
  },

  signalBars: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 1.5,
    height: 12,
  },

  signalBar: {
    width: 3,
    borderRadius: 1,
  },

  battery: {
    width: 24,
    height: 12,
    border: '1.5px solid',
    borderRadius: 3,
    padding: 1.5,
    position: 'relative',
  },

  batteryFill: {
    width: '100%',
    height: '100%',
    borderRadius: 1,
  },

  // Home Screen
  homeScreen: {
    height: '100%',
    padding: '0 20px',
    display: 'flex',
    flexDirection: 'column',
  },

  dateWidget: {
    textAlign: 'center',
    padding: '15px 0',
  },

  dateDay: {
    fontSize: 20,
    fontWeight: 600,
    color: '#3D3425',
  },

  currencyCard: {
    display: 'flex',
    background: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    padding: '14px 20px',
    marginBottom: 12,
    backdropFilter: 'blur(10px)',
  },

  currencyHalf: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },

  currencyEmoji: {
    fontSize: 28,
  },

  currencyText: {
    display: 'flex',
    flexDirection: 'column',
  },

  currencyLabel: {
    fontSize: 12,
    color: '#8B7355',
    fontWeight: 500,
  },

  currencyValue: {
    fontSize: 20,
    fontWeight: 700,
    color: '#3D3425',
  },

  currencyDivider: {
    width: 1,
    background: 'rgba(0,0,0,0.1)',
    margin: '0 15px',
  },

  deliveryCard: {
    background: 'linear-gradient(135deg, #FF9500 0%, #E68A00 100%)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },

  deliveryTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },

  deliveryIcon: {
    fontSize: 24,
  },

  deliveryInfo: {
    flex: 1,
  },

  deliveryLabel: {
    display: 'block',
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: 500,
  },

  deliveryTime: {
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
  },

  deliveryItems: {
    display: 'flex',
    gap: 4,
  },

  deliveryItemIcon: {
    fontSize: 20,
    background: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: '4px 6px',
  },

  deliveryProgress: {
    height: 4,
    background: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },

  deliveryProgressFill: {
    height: '100%',
    background: '#fff',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },

  // App Grid - iOS Style
  appGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '18px 12px',
    padding: '10px 0',
    flex: 1,
  },

  appWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
  },

  appIcon: {
    width: 62,
    height: 62,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },

  appEmoji: {
    fontSize: 30,
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
  },

  appLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: '#3D3425',
    textAlign: 'center',
  },

  quoteCard: {
    background: 'rgba(255,255,255,0.5)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },

  quoteContent: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },

  quoteIcon: {
    fontSize: 20,
  },

  quoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#5D4E37',
    lineHeight: 1.4,
    margin: 0,
  },

  quoteAuthor: {
    fontSize: 11,
    color: '#8B7355',
    marginTop: 4,
  },

  homeIndicator: {
    width: 134,
    height: 5,
    background: '#3D3425',
    borderRadius: 3,
    margin: '8px auto',
    opacity: 0.2,
  },

  // App Screen Common
  appScreen: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(180deg, #FDF8F0 0%, #F5ECD8 100%)',
  },

  appHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px 12px',
  },

  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px 4px',
  },

  backChevron: {
    fontSize: 28,
    fontWeight: 300,
    color: '#007AFF',
    lineHeight: 1,
  },

  backText: {
    fontSize: 17,
    color: '#007AFF',
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: 600,
    color: '#000',
  },

  headerRight: {
    minWidth: 60,
    display: 'flex',
    justifyContent: 'flex-end',
  },

  // Look App
  lookContent: {
    flex: 1,
    padding: '0 20px 20px',
    overflowY: 'auto',
  },

  viewfinder: {
    aspectRatio: '1',
    background: 'linear-gradient(135deg, #E8DFD0, #D4C9B8)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },

  viewfinderInner: {
    width: '100%',
    height: '100%',
    border: '3px dashed #7BA87B',
    borderRadius: 16,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderLeft: '4px solid #7BA87B',
    borderTop: '4px solid #7BA87B',
    borderRadius: '4px 0 0 0',
  },

  viewfinderHint: {
    fontSize: 14,
    color: '#7A6B5A',
  },

  scanBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #34C759, #28A745)',
    border: 'none',
    borderRadius: 14,
    fontSize: 17,
    fontWeight: 600,
    color: '#fff',
    cursor: 'pointer',
    marginBottom: 24,
  },

  recentSection: {
    marginTop: 'auto',
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#8B7355',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  recentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },

  recentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#fff',
    borderRadius: 12,
    padding: '12px 14px',
  },

  recentIcon: {
    fontSize: 24,
  },

  recentName: {
    flex: 1,
    fontSize: 15,
    fontWeight: 500,
    color: '#3D3425',
  },

  rarityTag: {
    fontSize: 11,
    fontWeight: 600,
    color: '#fff',
    padding: '4px 8px',
    borderRadius: 6,
    textTransform: 'capitalize',
  },

  // Scanning
  scanningView: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },

  scanningFrame: {
    width: 200,
    height: 200,
    border: '4px solid #34C759',
    borderRadius: 20,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },

  scanningEmoji: {
    fontSize: 60,
  },

  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    background: 'linear-gradient(90deg, transparent, #34C759, transparent)',
    animation: 'scanLine 1.5s ease-in-out infinite',
  },

  scanningText: {
    fontSize: 17,
    fontWeight: 600,
    color: '#3D3425',
  },

  // Result Card
  resultCard: {
    background: '#fff',
    borderRadius: 20,
    padding: 20,
    margin: '0 0 20px',
  },

  resultTop: {
    display: 'flex',
    gap: 16,
    marginBottom: 16,
  },

  resultEmoji: {
    fontSize: 50,
  },

  resultInfo: {
    flex: 1,
  },

  resultName: {
    fontSize: 22,
    fontWeight: 700,
    color: '#3D3425',
    margin: '0 0 4px',
  },

  resultScientific: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#8B7355',
    margin: '0 0 8px',
  },

  resultTags: {
    display: 'flex',
    gap: 6,
  },

  resultTag: {
    fontSize: 11,
    fontWeight: 600,
    color: '#fff',
    background: '#5AC8FA',
    padding: '4px 10px',
    borderRadius: 6,
  },

  resultDivider: {
    height: 1,
    background: '#E8E0D0',
    margin: '16px 0',
  },

  factSection: {
    marginBottom: 16,
  },

  factTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#3D3425',
    marginBottom: 8,
  },

  factText: {
    fontSize: 15,
    lineHeight: 1.5,
    color: '#5D4E37',
    margin: 0,
  },

  resultMeta: {
    display: 'flex',
    gap: 12,
    marginBottom: 16,
  },

  metaItem: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#F5EBD8',
    padding: '10px 12px',
    borderRadius: 10,
    fontSize: 13,
    color: '#5D4E37',
  },

  learnMoreBtn: {
    width: '100%',
    padding: 14,
    background: 'linear-gradient(135deg, #5AC8FA, #4AB5E6)',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    color: '#fff',
    cursor: 'pointer',
    marginBottom: 10,
  },

  scanAgainBtn: {
    width: '100%',
    padding: 14,
    background: 'rgba(0,0,0,0.05)',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    color: '#3D3425',
    cursor: 'pointer',
  },

  // Order App
  cartBtn: {
    fontSize: 24,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    padding: 4,
  },

  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    background: '#FF3B30',
    borderRadius: '50%',
    fontSize: 11,
    fontWeight: 700,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryRow: {
    display: 'flex',
    gap: 8,
    padding: '0 16px 12px',
    overflowX: 'auto',
  },

  categoryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.7)',
    border: 'none',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    color: '#5D4E37',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
  },

  categoryBtnActive: {
    background: '#34C759',
    color: '#fff',
  },

  catalogScroll: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 16px',
  },

  catalogGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 10,
    paddingBottom: 120,
  },

  itemCard: {
    background: '#fff',
    borderRadius: 14,
    padding: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '2px solid transparent',
  },

  itemCardSelected: {
    borderColor: '#34C759',
  },

  itemEmoji: {
    display: 'block',
    fontSize: 32,
    marginBottom: 8,
  },

  itemName: {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    color: '#3D3425',
    marginBottom: 2,
  },

  itemQty: {
    display: 'block',
    fontSize: 12,
    color: '#8B7355',
    marginBottom: 8,
  },

  itemPrice: {
    fontSize: 13,
    fontWeight: 600,
    color: '#5D4E37',
  },

  detailPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: '#fff',
    borderRadius: '20px 20px 0 0',
    padding: 20,
    boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
  },

  detailTop: {
    display: 'flex',
    gap: 14,
    marginBottom: 16,
  },

  detailEmoji: {
    fontSize: 40,
  },

  detailInfo: {
    flex: 1,
  },

  detailName: {
    fontSize: 18,
    fontWeight: 700,
    color: '#3D3425',
    margin: '0 0 4px',
  },

  detailDesc: {
    fontSize: 14,
    color: '#8B7355',
    margin: 0,
  },

  detailBottom: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  detailPrice: {
    fontSize: 18,
    fontWeight: 700,
    color: '#3D3425',
  },

  addBtn: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #34C759, #28A745)',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    color: '#fff',
    cursor: 'pointer',
  },

  // Modal
  modalOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    borderRadius: 44,
  },

  cartModal: {
    width: '100%',
    background: '#fff',
    borderRadius: '20px 20px 0 0',
    padding: 20,
    maxHeight: '70%',
  },

  cartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  closeBtn: {
    width: 32,
    height: 32,
    background: 'rgba(0,0,0,0.05)',
    border: 'none',
    borderRadius: '50%',
    fontSize: 16,
    cursor: 'pointer',
  },

  cartEmpty: {
    textAlign: 'center',
    padding: '40px 0',
    color: '#8B7355',
  },

  cartList: {
    maxHeight: 250,
    overflowY: 'auto',
  },

  cartItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 0',
    borderBottom: '1px solid #E8E0D0',
  },

  cartItemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: 500,
  },

  removeBtn: {
    width: 28,
    height: 28,
    background: 'rgba(255,59,48,0.1)',
    border: 'none',
    borderRadius: '50%',
    color: '#FF3B30',
    cursor: 'pointer',
  },

  checkoutBtn: {
    width: '100%',
    padding: 16,
    background: 'linear-gradient(135deg, #FF9500, #E68A00)',
    border: 'none',
    borderRadius: 14,
    fontSize: 17,
    fontWeight: 600,
    color: '#fff',
    cursor: 'pointer',
    marginTop: 16,
  },

  // Journal
  tabRow: {
    display: 'flex',
    gap: 8,
    padding: '0 16px 12px',
  },

  tabBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    background: 'rgba(255,255,255,0.6)',
    border: 'none',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    color: '#5D4E37',
    cursor: 'pointer',
  },

  tabBtnActive: {
    background: '#8B5A2B',
    color: '#fff',
  },

  journalContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 16px 20px',
  },

  progressBar: {
    background: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },

  progressFill: {
    background: '#34C759',
    padding: '8px 12px',
    fontSize: 13,
    fontWeight: 600,
    color: '#fff',
    width: '75%',
  },

  discoveryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
  },

  discoveryCard: {
    background: '#fff',
    borderRadius: 12,
    padding: 14,
    textAlign: 'center',
    transition: 'opacity 0.2s',
  },

  discoveryEmoji: {
    display: 'block',
    fontSize: 28,
    marginBottom: 6,
  },

  discoveryName: {
    fontSize: 11,
    fontWeight: 600,
    color: '#3D3425',
  },

  entriesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },

  entryCard: {
    background: '#fff',
    borderRadius: 14,
    padding: 16,
    borderLeft: '4px solid #8B5A2B',
  },

  entryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  entryMood: {
    fontSize: 18,
  },

  entryDate: {
    fontSize: 12,
    color: '#8B7355',
    fontWeight: 500,
  },

  entryTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#3D3425',
    margin: '0 0 6px',
  },

  entryText: {
    fontSize: 14,
    color: '#5D4E37',
    lineHeight: 1.4,
    margin: 0,
  },

  recipeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },

  recipeCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    background: '#fff',
    borderRadius: 14,
    padding: 14,
  },

  recipeEmoji: {
    fontSize: 32,
  },

  recipeInfo: {
    flex: 1,
  },

  recipeCheck: {
    color: '#34C759',
    fontSize: 18,
    fontWeight: 700,
  },

  recipeLock: {
    fontSize: 16,
  },

  // Friends
  friendsContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 16px 20px',
  },

  friendsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
  },

  friendCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    background: '#fff',
    borderRadius: 16,
    padding: 14,
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s ease',
  },

  friendAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  friendEmoji: {
    fontSize: 28,
  },

  friendInfo: {
    flex: 1,
  },

  friendName: {
    fontSize: 17,
    fontWeight: 600,
    color: '#3D3425',
    margin: '0 0 2px',
  },

  friendRole: {
    display: 'block',
    fontSize: 13,
    color: '#8B7355',
    marginBottom: 6,
  },

  hearts: {
    display: 'flex',
    gap: 2,
    fontSize: 14,
  },

  requestDot: {
    width: 10,
    height: 10,
    background: '#FF3B30',
    borderRadius: '50%',
    position: 'absolute',
    top: 14,
    right: 14,
  },

  boardCard: {
    background: '#fff',
    borderRadius: 16,
    padding: 16,
  },

  boardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },

  boardNote: {
    background: '#FFFBF0',
    borderRadius: 12,
    padding: 14,
    position: 'relative',
  },

  pin: {
    position: 'absolute',
    top: -8,
    left: 14,
  },

  noteAuthor: {
    display: 'block',
    fontSize: 12,
    color: '#8B7355',
    marginTop: 6,
  },

  // Resident Detail
  residentDetail: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px 20px 100px',
    textAlign: 'center',
  },

  residentAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  residentEmoji: {
    fontSize: 50,
  },

  residentName: {
    fontSize: 28,
    fontWeight: 700,
    color: '#3D3425',
    margin: '0 0 4px',
  },

  residentRole: {
    fontSize: 15,
    color: '#8B7355',
    marginBottom: 12,
  },

  residentHearts: {
    display: 'flex',
    gap: 4,
    marginBottom: 16,
  },

  residentBio: {
    fontSize: 15,
    color: '#5D4E37',
    lineHeight: 1.5,
    marginBottom: 16,
    maxWidth: 280,
  },

  residentStatus: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 16,
  },

  residentRequest: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    background: '#FFF8E7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    textAlign: 'left',
  },

  visitBtn: {
    width: '100%',
    padding: 16,
    background: 'linear-gradient(135deg, #34C759, #28A745)',
    border: 'none',
    borderRadius: 14,
    fontSize: 17,
    fontWeight: 600,
    color: '#fff',
    cursor: 'pointer',
    marginBottom: 12,
  },

  backToFriends: {
    background: 'none',
    border: 'none',
    fontSize: 15,
    color: '#007AFF',
    cursor: 'pointer',
  },

  // Map
  mapContent: {
    flex: 1,
    padding: '0 16px 20px',
    display: 'flex',
    flexDirection: 'column',
  },

  mapView: {
    flex: 1,
    background: 'linear-gradient(180deg, #5AC8FA, #4AB8EA)',
    borderRadius: 20,
    position: 'relative',
    marginBottom: 16,
    minHeight: 300,
    overflow: 'hidden',
  },

  ocean: {
    position: 'absolute',
    inset: 0,
  },

  island: {
    position: 'absolute',
    left: '15%',
    top: '20%',
    width: '70%',
    height: '65%',
    background: 'linear-gradient(135deg, #7BA87B, #5D8A5D)',
    borderRadius: '45% 55% 50% 50% / 50% 50% 55% 45%',
  },

  marker: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transform: 'translate(-50%, -50%)',
    transition: 'opacity 0.2s',
  },

  markerLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: '#fff',
    background: 'rgba(0,0,0,0.5)',
    padding: '2px 6px',
    borderRadius: 4,
    marginTop: 2,
  },

  fog: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '45%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7))',
    borderRadius: '0 45% 55% 0',
  },

  mapStats: {
    display: 'flex',
    gap: 10,
    marginBottom: 16,
  },

  mapStat: {
    flex: 1,
    background: '#fff',
    borderRadius: 14,
    padding: 14,
    textAlign: 'center',
  },

  statValue: {
    display: 'block',
    fontSize: 20,
    fontWeight: 700,
    color: '#3D3425',
  },

  statLabel: {
    fontSize: 12,
    color: '#8B7355',
  },

  // Mail/Stamps
  mailContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 16px 20px',
  },

  stampCount: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 16,
    fontWeight: 600,
    color: '#3D3425',
  },

  stampBook: {
    textAlign: 'center',
    padding: '20px 0',
    borderBottom: '1px solid #E8E0D0',
    marginBottom: 20,
  },

  stampBookTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#3D3425',
    margin: '0 0 4px',
  },

  stampBookSub: {
    fontSize: 14,
    color: '#8B7355',
  },

  stampGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
    marginBottom: 20,
  },

  stampCard: {
    background: '#fff',
    borderRadius: 12,
    padding: 4,
    position: 'relative',
    transition: 'all 0.2s ease',
  },

  stampPerf: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    display: 'flex',
    justifyContent: 'space-around',
    padding: '0 8px',
  },

  perf: {
    width: 8,
    height: 8,
    background: 'linear-gradient(180deg, #FDF8F0, #F5ECD8)',
    borderRadius: '50%',
    marginTop: -4,
  },

  stampInner: {
    padding: 16,
    textAlign: 'center',
  },

  stampEmoji: {
    display: 'block',
    fontSize: 32,
    marginBottom: 8,
  },

  stampName: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#3D3425',
    marginBottom: 4,
  },

  stampValue: {
    fontSize: 11,
    color: '#34C759',
    fontWeight: 600,
  },

  tipCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'rgba(52, 199, 89, 0.1)',
    borderRadius: 14,
    padding: 14,
  },

  // Weather
  weatherScreen: {
    height: '100%',
    background: 'linear-gradient(180deg, #5AC8FA 0%, #4AB8EA 50%, #3AA8DA 100%)',
    padding: '0 20px',
    display: 'flex',
    flexDirection: 'column',
  },

  weatherBack: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: 17,
    cursor: 'pointer',
    padding: '8px 0',
    marginBottom: 20,
  },

  weatherHero: {
    textAlign: 'center',
    marginBottom: 40,
  },

  weatherIcon: {
    display: 'block',
    fontSize: 80,
    marginBottom: 10,
  },

  weatherTemp: {
    display: 'block',
    fontSize: 72,
    fontWeight: 200,
    color: '#fff',
    lineHeight: 1,
  },

  weatherCondition: {
    display: 'block',
    fontSize: 22,
    color: '#fff',
    marginTop: 8,
  },

  weatherLocation: {
    display: 'block',
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },

  weatherDetails: {
    display: 'flex',
    justifyContent: 'space-around',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },

  weatherDetail: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    color: '#fff',
    fontSize: 14,
  },

  forecastSection: {
    marginTop: 'auto',
    marginBottom: 40,
  },

  forecastTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },

  forecastRow: {
    display: 'flex',
    justifyContent: 'space-between',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 16,
  },

  forecastItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    color: '#fff',
  },

  forecastDay: {
    fontSize: 13,
    fontWeight: 500,
  },

  forecastIcon: {
    fontSize: 24,
  },

  forecastHigh: {
    fontSize: 15,
    fontWeight: 600,
  },

  forecastLow: {
    fontSize: 13,
    opacity: 0.7,
  },

  // Settings
  settingsContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 16px 20px',
  },

  settingsGroup: {
    marginBottom: 24,
  },

  settingsGroupTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#8B7355',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 4,
  },

  settingsCard: {
    background: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
  },

  settingsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    borderBottom: '1px solid #E8E0D0',
  },

  settingsLabel: {
    flex: 1,
    fontSize: 16,
    color: '#3D3425',
  },

  chevron: {
    fontSize: 20,
    color: '#C4C4C6',
    fontWeight: 300,
  },

  toggle: {
    width: 50,
    height: 30,
    background: '#E9E9EB',
    borderRadius: 15,
    position: 'relative',
    transition: 'background 0.2s',
  },

  toggleThumb: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 26,
    height: 26,
    background: '#fff',
    borderRadius: '50%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    transition: 'left 0.2s',
  },

  settingsFooter: {
    textAlign: 'center',
    fontSize: 13,
    color: '#8B7355',
    marginTop: 30,
    lineHeight: 1.6,
  },

  // Toast
  toast: {
    position: 'fixed',
    top: 60,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#fff',
    borderRadius: 12,
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    animation: 'toastSlide 0.3s ease',
    zIndex: 1000,
  },

  toastIcon: {
    color: '#34C759',
    fontWeight: 700,
  },
};

export default KeeperPhone;
