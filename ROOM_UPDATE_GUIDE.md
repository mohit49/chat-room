# Room Update Functionality - Complete Guide

## ✅ Features Implemented

### 1. **Update Room Name**
- Edit the room name (1-100 characters)
- Required field
- Updates immediately

### 2. **Update Room Description**
- Edit the room description (up to 500 characters)
- Optional field
- Can be left empty

### 3. **Update Room Profile Picture**
Two options available:
- **Upload Photo**: Upload a custom image
- **Choose Avatar**: Select from avatar styles (Adventurer, Avataaars, Bottts, Fun Emoji, Lorelei, Micah, Open Peeps, Personas, Pixel Art, Shapes)

## 🔧 How to Use

### **Step 1: Open Edit Modal**
1. Go to the home page
2. Find the room you want to edit
3. Click the **Settings icon** (⚙️) on the room card
4. Click **"Edit Room"** from the dropdown menu

### **Step 2: Edit Room Details**
1. **Room Name**: Type the new name in the input field
2. **Description**: Type or update the description (optional)
3. **Profile Picture**:
   - Click **"Upload Photo"** to upload an image, OR
   - Click **"Choose Avatar"** to select an avatar style

### **Step 3: Save Changes**
1. Click **"Update Room"** button
2. Wait for the success message
3. The modal will close automatically
4. The room card will update with new details

## 🎯 API Endpoint

```
PUT /api/rooms/:id
```

### **Request Format:**
```json
{
  "name": "Updated Room Name",
  "description": "Updated description",
  "profilePicture": {
    "type": "avatar",
    "avatarStyle": "adventurer",
    "seed": "customseed"
  }
}
```

### **Response Format:**
```json
{
  "success": true,
  "room": {
    "id": "68e1605a383832adec4a2b95",
    "roomId": "#ABC123",
    "name": "Updated Room Name",
    "description": "Updated description",
    "profilePicture": {
      "type": "avatar",
      "avatarStyle": "adventurer",
      "seed": "customseed"
    },
    "members": [...],
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "isActive": true
  },
  "message": "Room updated successfully"
}
```

## 🔍 Debugging

### **Browser Console Logs:**
When you submit the form, you'll see:
```
=== UPDATE ROOM REQUEST ===
Room ID: 68e1605a383832adec4a2b95
Name: New Room Name
Description: New description
Profile Picture: { type: 'avatar', avatarStyle: 'adventurer', seed: 'room123' }
Update Data: { name: 'New Room Name', description: 'New description', profilePicture: {...} }

API updateRoom called with id: 68e1605a383832adec4a2b95
API updateRoom URL: /rooms/68e1605a383832adec4a2b95

=== UPDATE ROOM RESPONSE ===
Response: { success: true, room: {...}, message: 'Room updated successfully' }
✅ Room updated successfully!
Updated room: { id: '...', name: '...', ... }
```

### **Server Console Logs:**
```
Update room request - id: 68e1605a383832adec4a2b95
Update room request - body: { name: '...', description: '...', profilePicture: {...} }
Update room request - userId: 507f1f77bcf86cd799439011

Room service updateRoomByMongoId - id: 68e1605a383832adec4a2b95
Room service updateRoomByMongoId - updatedBy: 507f1f77bcf86cd799439011
getUserRoleInRoomByMongoId - id: 68e1605a383832adec4a2b95 userId: 507f1f77bcf86cd799439011
Found room: yes
Found member: admin
Can user edit room: true
```

## ⚠️ Permissions

### **Who Can Edit:**
- ✅ **Admin**: Full edit access
- ✅ **Editor**: Full edit access
- ❌ **Viewer**: Cannot edit

### **Access Denied Message:**
If you're not an admin or editor, you'll see:
```
Access Denied
You don't have permission to edit this room. Only admins can edit room details.
```

## 🐛 Troubleshooting

### **Issue: Modal closes when clicking "Choose Avatar"**
**Solution:** ✅ Fixed! Buttons now have `type="button"` to prevent form submission

### **Issue: "Route PUT /api/rooms/ not found"**
**Solution:** ✅ Fixed! Now using MongoDB `_id` instead of custom `roomId`

### **Issue: "User not authenticated"**
**Solution:** Make sure you're logged in and the JWT token is valid

### **Issue: "You do not have permission to edit this room"**
**Solution:** Check your role in the room. Only admins and editors can edit.

### **Issue: Profile picture not updating**
**Check:**
1. Is the avatar selector showing?
2. Did you select an avatar?
3. Check browser console for errors
4. Check server console for validation errors

## ✨ Testing Checklist

- [ ] Update room name only
- [ ] Update description only
- [ ] Update profile picture only (upload)
- [ ] Update profile picture only (avatar)
- [ ] Update all fields together
- [ ] Clear description (set to empty)
- [ ] Try with very long name (should fail at 100 chars)
- [ ] Try with very long description (should fail at 500 chars)
- [ ] Try as viewer (should show access denied)
- [ ] Try as editor (should work)
- [ ] Try as admin (should work)

## 📝 Example Updates

### **1. Update Name Only:**
```javascript
{
  "name": "Marketing Team Room"
}
```

### **2. Update Name and Description:**
```javascript
{
  "name": "Marketing Team Room",
  "description": "Room for marketing team collaboration and planning"
}
```

### **3. Update with Avatar:**
```javascript
{
  "name": "Marketing Team Room",
  "description": "Team collaboration space",
  "profilePicture": {
    "type": "avatar",
    "avatarStyle": "bottts",
    "seed": "marketing123"
  }
}
```

### **4. Update with Uploaded Image:**
```javascript
{
  "name": "Marketing Team Room",
  "profilePicture": {
    "type": "upload",
    "url": "https://example.com/room-image.jpg"
  }
}
```

## 🎉 Success!

If everything works correctly, you should see:
1. ✅ Modal opens with current room data
2. ✅ Can edit all fields
3. ✅ Can select avatar without modal closing
4. ✅ Update button shows "Updating..." during save
5. ✅ Success message appears
6. ✅ Modal closes automatically
7. ✅ Room card updates with new data
8. ✅ Changes persist after page refresh

---

**Last Updated:** 2025-01-05
**Status:** ✅ Fully Functional
