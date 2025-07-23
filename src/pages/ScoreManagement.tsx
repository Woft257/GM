import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Edit3, X } from 'lucide-react';

import { useUsers, useUser } from '../hooks/useUsers';
import { updateUserScoreAdmin, deleteUserScoreAdmin } from '../lib/database';
import { booths } from '../data/booths';

const ScoreManagement: React.FC = () => {
  const navigate = useNavigate();
  const { users } = useUsers();
  const [searchUsername, setSearchUsername] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const { user: currentUser, loading: userLoading } = useUser(selectedUser);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showEditMode, setShowEditMode] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<typeof users>([]);

  // Initialize scores when user is loaded
  useEffect(() => {
    if (currentUser) {
      setScores(currentUser.scores || {});
      setShowEditMode(false); // Reset edit mode when user changes
    }
  }, [currentUser]);

  // Initialize filtered users
  useEffect(() => {
    setFilteredUsers(users);
  }, [users]);



  const handleBackToList = () => {
    setSelectedUser('');
    setScores({});
    setShowEditMode(false);
    setMessage(null);
    setSearchUsername('');
    setFilteredUsers(users); // Reset filtered users
  };

  const handleSearchInputChange = (value: string) => {
    setSearchUsername(value);

    if (value.trim().length >= 1) {
      const searchTerm = value.trim().toLowerCase();

      // Filter users for user list
      const matchingUsers = users.filter(user =>
        user.telegram.toLowerCase().includes(searchTerm)
      );

      // Update filtered users list
      setFilteredUsers(matchingUsers);
    } else {
      setFilteredUsers(users); // Show all users when no search term
    }
  };

  const handleClearSearch = () => {
    setSearchUsername('');
    setFilteredUsers(users);
    setMessage(null);
  };

  const handleStartEdit = () => {
    setShowEditMode(true);
  };

  const handleCancelEdit = () => {
    // Reset scores to original values
    if (currentUser) {
      setScores(currentUser.scores || {});
    }
    setShowEditMode(false);
    setMessage(null);
  };

  const handleScoreChange = (boothId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setScores(prev => ({
      ...prev,
      [boothId]: numValue
    }));
  };

  const handleSaveScores = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      
      // Update each booth score
      for (const [boothId, score] of Object.entries(scores)) {
        if (score > 0) {
          await updateUserScoreAdmin(selectedUser, boothId, score);
        } else if (currentUser?.scores?.[boothId]) {
          // Delete score if set to 0 and previously existed
          await deleteUserScoreAdmin(selectedUser, boothId);
        }
      }

      setMessage({ type: 'success', text: 'Đã cập nhật điểm thành công!' });
      setShowEditMode(false); // Exit edit mode after successful save
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error updating scores:', error);
      setMessage({ type: 'error', text: 'Có lỗi khi cập nhật điểm!' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAllScores = async () => {
    if (!selectedUser || !confirm('Bạn có chắc muốn xóa tất cả điểm của user này?')) return;

    try {
      setSaving(true);
      
      // Delete all scores
      for (const boothId of Object.keys(currentUser?.scores || {})) {
        await deleteUserScoreAdmin(selectedUser, boothId);
      }

      setScores({});
      setShowEditMode(false); // Exit edit mode after deletion
      setMessage({ type: 'success', text: 'Đã xóa tất cả điểm thành công!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting scores:', error);
      setMessage({ type: 'error', text: 'Có lỗi khi xóa điểm!' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const totalScore = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);

  return (
    <div className="min-h-screen bg-black">
      {/* MEXC-style Header */}
      <div className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src="/mexc-gm-collaboration-logo.png" alt="MEXC x GM Vietnam" className="h-6 sm:h-8" />
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate('/admin')}
                className="text-white/70 hover:text-white text-sm"
              >
                ← Về Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Edit3 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">Quản lý điểm số</h1>
          <p className="text-white/70 text-sm sm:text-base">
            Chỉnh sửa điểm từng booth cho user
          </p>
        </div>

          {/* Search User */}
          {!selectedUser && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Tìm kiếm user</h2>
              <div className="relative">
                <input
                  type="text"
                  value={searchUsername}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  placeholder="Nhập username để tìm kiếm và lọc danh sách..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 pr-10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
                {searchUsername && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Search Message */}
              {message && (
                <div className={`mt-3 p-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Search Results Info */}
              {searchUsername && (
                <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-xs sm:text-sm text-blue-400">
                    🔍 Tìm thấy <span className="font-semibold">{filteredUsers.length}</span> user phù hợp với "{searchUsername}"
                  </p>
                </div>
              )}

              <p className="text-xs sm:text-sm text-white/50 mt-2">
                💡 Gõ để lọc danh sách bên dưới • Click vào user để chọn • Tổng {users.length} user
              </p>
            </div>
          )}

          {/* User Info & Scores */}
          {selectedUser && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              {/* Header with Back Button */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handleBackToList}
                  className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Quay lại</span>
                </button>
                <div className="text-right">
                  <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-32 sm:max-w-none">{selectedUser}</h2>
                  <p className="text-xs sm:text-sm text-white/70">
                    Tổng: <span className="font-semibold text-yellow-400">{totalScore}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {!showEditMode ? (
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                  <button
                    onClick={handleStartEdit}
                    disabled={userLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Chỉnh sửa điểm</span>
                  </button>
                  <button
                    onClick={handleDeleteAllScores}
                    disabled={saving || userLoading}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{saving ? 'Đang xóa...' : 'Xóa tất cả'}</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                  <button
                    onClick={handleSaveScores}
                    disabled={saving || userLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Hủy</span>
                  </button>
                </div>
              )}

              {/* Message */}
              {message && (
                <div className={`mb-4 p-3 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Booth Scores */}
              {userLoading ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-2 border-white/30 border-t-white mx-auto mb-3 sm:mb-4"></div>
                  <p className="text-white/70 text-sm sm:text-base">Đang tải thông tin user...</p>
                </div>
              ) : showEditMode ? (
                <div className="space-y-3">
                  <h3 className="text-sm sm:text-base font-semibold text-white mb-3">Chỉnh sửa điểm từng booth:</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {booths.map((booth) => (
                      <div key={booth.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white text-xs sm:text-sm truncate flex-1 mr-2">{booth.name}</h4>
                          <span className="text-xs text-white/50 flex-shrink-0">#{booth.id}</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={scores[booth.id] || ''}
                          onChange={(e) => handleScoreChange(booth.id, e.target.value)}
                          placeholder="0"
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                        />
                        {currentUser?.scores?.[booth.id] && (
                          <p className="text-xs text-white/50 mt-1">
                            Điểm cũ: {currentUser.scores[booth.id]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-sm sm:text-base font-semibold text-white mb-3">Điểm hiện tại:</h3>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {booths.map((booth) => {
                      const score = currentUser?.scores?.[booth.id];
                      return (
                        <div key={booth.id} className={`p-3 rounded-lg border ${
                          score ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'
                        }`}>
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-white text-xs sm:text-sm truncate flex-1 mr-2">{booth.name}</h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-white/50">#{booth.id}</span>
                              <span className={`font-bold text-sm sm:text-base ${
                                score ? 'text-green-400' : 'text-white/30'
                              }`}>
                                {score || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filtered User List */}
          {!selectedUser && filteredUsers.length > 0 && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
                {searchUsername ? `Kết quả tìm kiếm (${filteredUsers.length})` : `Danh sách user (${filteredUsers.length})`}
              </h2>
              <div className="space-y-2 max-h-80 sm:max-h-96 overflow-y-auto">
                {filteredUsers.slice(0, 20).map((user, index) => (
                  <button
                    key={user.telegram}
                    onClick={() => setSelectedUser(user.telegram)}
                    className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-700/50 active:bg-gray-600/50 border border-gray-700 rounded-lg transition-colors text-left touch-manipulation"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-white/50 font-mono">#{index + 1}</span>
                        <p className="font-medium text-white text-sm sm:text-base truncate">{user.telegram}</p>
                      </div>
                      <p className="text-xs sm:text-sm text-white/70">
                        Tổng điểm: <span className="font-semibold text-yellow-400">{user.totalScore}</span>
                        {user.playedBooths && Object.keys(user.playedBooths).length > 0 && (
                          <span className="ml-2">• {Object.keys(user.playedBooths).length} booth</span>
                        )}
                      </p>
                    </div>
                    <Edit3 className="h-4 w-4 text-white/50 flex-shrink-0 ml-2" />
                  </button>
                ))}
                {filteredUsers.length > 20 && (
                  <div className="text-center py-3 border-t border-white/10">
                    <p className="text-white/50 text-xs sm:text-sm">
                      Và {filteredUsers.length - 20} user khác...
                    </p>
                    <p className="text-white/30 text-xs mt-1">
                      {searchUsername ? 'Nhập chính xác hơn để thu hẹp kết quả' : 'Sử dụng tìm kiếm để lọc danh sách'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No Results */}
          {!selectedUser && searchUsername && filteredUsers.length === 0 && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-lg font-bold text-white mb-2">Không tìm thấy user nào</h3>
              <p className="text-white/70 text-sm mb-4">
                Không có user nào phù hợp với từ khóa "<span className="font-semibold">{searchUsername}</span>"
              </p>
              <button
                onClick={handleClearSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
              >
                Xóa tìm kiếm
              </button>
            </div>
          )}
      </div>
    </div>
  );
};

export default ScoreManagement;
