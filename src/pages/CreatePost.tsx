
import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from "uuid";

const CreatePost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Text post state
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  
  // Poll post state
  const [pollTitle, setPollTitle] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  
  // Media post state
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaCaption, setMediaCaption] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("text");

  if (!user) {
    return <Navigate to="/login" />;
  }

  const handleAddPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, ""]);
    } else {
      toast({
        title: "Maximum options reached",
        description: "You can only add up to 5 options for a poll.",
        variant: "destructive",
      });
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      const newOptions = [...pollOptions];
      newOptions.splice(index, 1);
      setPollOptions(newOptions);
    } else {
      toast({
        title: "Minimum options required",
        description: "Polls must have at least 2 options.",
        variant: "destructive",
      });
    }
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const fileType = file.type;
    if (!fileType.startsWith('image/') && !fileType.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image or video file.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (5MB for images, 15MB for videos)
    const maxSize = fileType.startsWith('image/') ? 5 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: fileType.startsWith('image/') 
          ? "Images must be under 5MB." 
          : "Videos must be under 15MB.",
        variant: "destructive",
      });
      return;
    }

    setMediaFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitTextPost = async () => {
    if (!textContent.trim()) {
      toast({
        title: "Content required",
        description: "Please enter some content for your post.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("posts")
        .insert([
          {
            title: textTitle.trim() || null,
            content: textContent.trim(),
            type: "text",
            likes_count: 0,
            comments_count: 0
          }
        ])
        .select();

      if (error) throw error;

      toast({
        title: "Post created",
        description: "Your anonymous post has been published."
      });

      navigate("/");
    } catch (error) {
      console.error("Error creating text post:", error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPollPost = async () => {
    if (!pollQuestion.trim()) {
      toast({
        title: "Question required",
        description: "Please enter a question for your poll.",
        variant: "destructive",
      });
      return;
    }

    // Filter out empty options and check for at least 2 valid options
    const validOptions = pollOptions.filter(opt => opt.trim() !== "");
    if (validOptions.length < 2) {
      toast({
        title: "Options required",
        description: "Please provide at least 2 valid options for your poll.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // 1. Create the poll post
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .insert([
          {
            title: pollTitle.trim() || null,
            content: pollQuestion.trim(),
            type: "poll",
            likes_count: 0,
            comments_count: 0
          }
        ])
        .select();

      if (postError || !postData || !postData[0]) throw postError;

      // 2. Create the poll options
      const pollOptionInserts = validOptions.map(optionText => ({
        post_id: postData[0].id,
        option_text: optionText.trim(),
        votes_count: 0
      }));

      const { error: optionsError } = await supabase
        .from("poll_options")
        .insert(pollOptionInserts);

      if (optionsError) throw optionsError;

      toast({
        title: "Poll created",
        description: "Your anonymous poll has been published."
      });

      navigate("/");
    } catch (error) {
      console.error("Error creating poll post:", error);
      toast({
        title: "Error",
        description: "Failed to create poll. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMediaPost = async () => {
    if (!mediaFile) {
      toast({
        title: "Media required",
        description: "Please upload an image or video for your post.",
        variant: "destructive",
      });
      return;
    }

    if (!mediaCaption.trim()) {
      toast({
        title: "Caption required",
        description: "Please add a caption for your media.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // 1. Upload the media file to Supabase Storage
      const fileExt = mediaFile.name.split('.').pop();
      const filePath = `${user.id}/${uuidv4()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, mediaFile);

      if (uploadError) throw uploadError;

      // 2. Get the public URL of the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // 3. Create the media post
      const { error: postError } = await supabase
        .from("posts")
        .insert([
          {
            title: mediaTitle.trim() || null,
            content: mediaCaption.trim(),
            type: "media",
            media_url: publicUrlData.publicUrl,
            media_type: mediaFile.type,
            likes_count: 0,
            comments_count: 0
          }
        ]);

      if (postError) throw postError;

      toast({
        title: "Media post created",
        description: "Your anonymous media post has been published."
      });

      navigate("/");
    } catch (error) {
      console.error("Error creating media post:", error);
      toast({
        title: "Error",
        description: "Failed to create media post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    switch (activeTab) {
      case "text":
        handleSubmitTextPost();
        break;
      case "poll":
        handleSubmitPollPost();
        break;
      case "media":
        handleSubmitMediaPost();
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Create Anonymous Post</h1>
        
        <Tabs 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="poll">Poll</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit}>
            <TabsContent value="text">
              <Card>
                <CardHeader>
                  <CardTitle>Share your thoughts anonymously</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title (optional)</Label>
                    <Input
                      id="title"
                      value={textTitle}
                      onChange={(e) => setTextTitle(e.target.value)}
                      placeholder="Add a title..."
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="What's on your mind?"
                      className="min-h-[200px]"
                      maxLength={2000}
                    />
                    <div className="text-sm text-muted-foreground text-right">
                      {textContent.length}/2000
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="ml-auto" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      "Post Anonymously"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="poll">
              <Card>
                <CardHeader>
                  <CardTitle>Create an anonymous poll</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="poll-title">Title (optional)</Label>
                    <Input
                      id="poll-title"
                      value={pollTitle}
                      onChange={(e) => setPollTitle(e.target.value)}
                      placeholder="Add a title..."
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="poll-question">Question</Label>
                    <Textarea
                      id="poll-question"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder="Ask a question..."
                      maxLength={200}
                    />
                    <div className="text-sm text-muted-foreground text-right">
                      {pollQuestion.length}/200
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Options</Label>
                    {pollOptions.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => handlePollOptionChange(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          maxLength={100}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemovePollOption(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    {pollOptions.length < 5 && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleAddPollOption}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Option
                      </Button>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="ml-auto" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Poll...
                      </>
                    ) : (
                      "Create Poll"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="media">
              <Card>
                <CardHeader>
                  <CardTitle>Share media anonymously</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="media-title">Title (optional)</Label>
                    <Input
                      id="media-title"
                      value={mediaTitle}
                      onChange={(e) => setMediaTitle(e.target.value)}
                      placeholder="Add a title..."
                      maxLength={100}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="media-upload">Upload Media</Label>
                    <div className="border border-input rounded-md p-4">
                      {!mediaPreview ? (
                        <div className="flex flex-col items-center justify-center py-4">
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground mb-2">
                            Upload an image or video
                          </p>
                          <p className="text-xs text-muted-foreground mb-4">
                            Images: Max 5MB • Videos: Max 15MB
                          </p>
                          <Input
                            id="media-upload"
                            type="file"
                            accept="image/*,video/*"
                            className="max-w-xs"
                            onChange={handleMediaFileChange}
                          />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="relative aspect-video flex items-center justify-center overflow-hidden rounded-md">
                            {mediaFile?.type.startsWith('image/') ? (
                              <img
                                src={mediaPreview}
                                alt="Media preview"
                                className="max-h-[300px] object-contain"
                              />
                            ) : (
                              <video
                                src={mediaPreview}
                                className="max-h-[300px] object-contain"
                                controls
                              />
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setMediaFile(null);
                              setMediaPreview(null);
                            }}
                          >
                            Change Media
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="media-caption">Caption</Label>
                    <Textarea
                      id="media-caption"
                      value={mediaCaption}
                      onChange={(e) => setMediaCaption(e.target.value)}
                      placeholder="Add a caption..."
                      maxLength={500}
                    />
                    <div className="text-sm text-muted-foreground text-right">
                      {mediaCaption.length}/500
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="ml-auto" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Post Media"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </form>
        </Tabs>
      </div>
    </div>
  );
};

export default CreatePost;
